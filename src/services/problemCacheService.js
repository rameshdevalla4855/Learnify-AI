import { db } from './firebase';
import {
    collection, doc, getDocs, getDoc, setDoc, writeBatch,
    query, orderBy, limit as firestoreLimit, startAfter,
    where, Timestamp
} from 'firebase/firestore';

const COLLECTION = 'leetcodeProblems';
const META_DOC = '_metadata';

/**
 * Cache an array of problems to Firestore.
 * Uses batch writes for efficiency (max 500 per batch).
 */
export async function cacheProblems(problems) {
    if (!problems?.length) return;

    const batchSize = 450; // stay under Firestore's 500 limit
    for (let i = 0; i < problems.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = problems.slice(i, i + batchSize);

        chunk.forEach(p => {
            const docRef = doc(db, COLLECTION, p.titleSlug);
            batch.set(docRef, {
                titleSlug: p.titleSlug,
                title: p.title || '',
                difficulty: p.difficulty || 'Medium',
                acRate: p.acRate || null,
                isPaidOnly: p.isPaidOnly || false,
                topicTags: (p.topicTags || []).map(t => ({
                    name: t.name || '',
                    slug: t.slug || '',
                })),
                // Flatten topic names for filtering
                topicNames: (p.topicTags || []).map(t => t.name || ''),
                frontendQuestionId: p.frontendQuestionId || null,
                cachedAt: Timestamp.now(),
            }, { merge: true });
        });

        await batch.commit();
    }

    // Update metadata timestamp
    await setDoc(doc(db, COLLECTION, META_DOC), {
        lastSyncedAt: Timestamp.now(),
        totalCached: problems.length,
    }, { merge: true });
}

/**
 * Get cached problems with cursor-based pagination.
 * @param {number} pageSize
 * @param {DocumentSnapshot|null} startAfterDoc - cursor from previous page
 * @param {object} filters - { difficulty, topicName, search }
 * @returns {{ problems: Array, lastDoc: DocumentSnapshot|null, hasMore: boolean }}
 */
export async function getCachedProblems(pageSize = 30, startAfterDoc = null, filters = {}) {
    try {
        const colRef = collection(db, COLLECTION);
        const constraints = [orderBy('titleSlug')];

        // Difficulty filter
        if (filters.difficulty && filters.difficulty !== 'All') {
            constraints.unshift(where('difficulty', '==', filters.difficulty));
        }

        // Topic filter
        if (filters.topicName && filters.topicName !== 'All Topics') {
            constraints.unshift(where('topicNames', 'array-contains', filters.topicName));
        }

        constraints.push(firestoreLimit(pageSize + 1)); // fetch one extra to check hasMore

        if (startAfterDoc) {
            constraints.push(startAfter(startAfterDoc));
        }

        const q = query(colRef, ...constraints);
        const snapshot = await getDocs(q);

        const docs = snapshot.docs.filter(d => d.id !== META_DOC);
        const hasMore = docs.length > pageSize;
        const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

        const problems = pageDocs.map(d => ({ ...d.data(), _docSnap: d }));
        const lastDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;

        return { problems, lastDoc, hasMore };
    } catch (error) {
        console.error('Error reading cached problems:', error);
        return { problems: [], lastDoc: null, hasMore: false };
    }
}

/**
 * Get the timestamp of the last API sync.
 */
export async function getLastSyncTime() {
    try {
        const snap = await getDoc(doc(db, COLLECTION, META_DOC));
        if (snap.exists()) {
            const data = snap.data();
            return data.lastSyncedAt?.toDate() || null;
        }
        return null;
    } catch {
        return null;
    }
}
