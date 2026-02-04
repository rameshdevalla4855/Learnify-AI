import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';

export default function MyCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        async function fetchCourses() {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                // Fetch courses created by user OR enrolled by user
                // For MVP, simplistic query: fetch all courses created by user
                // In real app: check 'enrolledCourses' array in user profile
                const q = query(
                    collection(db, "courses"),
                    where("createdBy", "==", currentUser.uid)
                );

                const querySnapshot = await getDocs(q);
                const coursesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setCourses(coursesData);
            } catch (err) {
                console.error("Error fetching courses:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCourses();
    }, [currentUser]);

    if (loading) return <div className="p-8 text-center">Loading courses...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Courses</h1>
                <Link
                    to="/add-course"
                    className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Course
                </Link>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-dashed">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No courses yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by importing a YouTube playlist.</p>
                    <div className="mt-6">
                        <Link
                            to="/add-course"
                            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                        >
                            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Add Course
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <Link
                            key={course.id}
                            to={`/course/${course.id}`}
                            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800 flex flex-col"
                        >
                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                                {course.thumbnail && (
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                )}
                            </div>
                            <div className="p-4 flex flex-1 flex-col">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">{course.title}</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{course.channelTitle}</p>
                                <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-500">
                                    <span>{course.itemCount} Videos</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
