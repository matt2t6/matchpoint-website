import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { 
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { motion } from 'framer-motion';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);

const EnhancedPitchDeck = () => {
    const navigate = useNavigate();
    
    return (
        <div className="min-h-screen bg-gradient-135 from-[#0d1117] via-[#161b22] to-[#0d1117] text-[#c9d1d9]">
            {/* Progress Bar */}
            <motion.div 
                className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#00F5D4] via-[#0ea5e9] to-[#a855f7]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 60, ease: "linear" }}
            />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 bg-[#0d1117]/95 backdrop-blur-xl border-b border-[#303a3d]/30 p-3 z-50">
                <div className="flex justify-between items-center">
                    <img src="/assets/mini matchpoint logo.svg" alt="MatchPoint Systems" className="w-14 h-auto filter drop-shadow-glow" />
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-20">
                    {/* Hero Section */}
                    <section className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                            <motion.video
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                width="350"
                                height="350"
                                autoPlay
                                muted
                                loop
                                className="rounded-2xl shadow-2xl mx-auto"
                            >
                                <source src="/assets/logo.mp4" type="video/mp4" />
                            </motion.video>
                            <motion.h1 
                                className="text-5xl md:text-7xl font-black text-white leading-tight mt-8"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Emotional Intelligence<br />
                                <span className="text-[#00F5D4]">Meets Precision Coaching</span>
                            </motion.h1>
                            <motion.p 
                                className="text-xl md:text-2xl text-slate-300 mt-4"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                Built for Every Court
                            </motion.p>
                            <motion.div 
                                className="mt-8"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <div className="glass-card p-4 max-w-2xl mx-auto">
                                    <p className="text-lg">
                                        <span className="text-[#00F5D4] font-bold">We're raising $50K to deploy our MVP.</span>{' '}
                                        <span className="text-cyan-400">Join the founding cohort shaping emotionally intelligent coaching.</span>
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {/* Coach Section */}
                    <section className="min-h-screen py-16 px-6 lg:px-8">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-[90rem] mx-auto"
                        >
                            <h2 className="text-4xl font-bold text-center mb-12">
                                <span className="text-[#00F5D4]">Advanced Coaching</span> Analytics
                            </h2>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                                {/* Sample Analytics Charts */}
                                <div className="glass-card p-8">
                                    <h3 className="text-2xl font-semibold mb-6">Performance Metrics</h3>
                                    <div style={{ height: 300 }}>
                                    <Line 
                                        data={{
                                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                                            datasets: [{
                                                label: 'Player Progress',
                                                data: [65, 78, 82, 75, 88, 95],
                                                borderColor: '#00F5D4',
                                                tension: 0.4,
                                                fill: true,
                                                backgroundColor: 'rgba(0, 245, 212, 0.1)'
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'top',
                                                },
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    grid: {
                                                        color: 'rgba(255, 255, 255, 0.1)'
                                                    }
                                                },
                                                x: {
                                                    grid: {
                                                        color: 'rgba(255, 255, 255, 0.1)'
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                    </div>
                                </div>
                                
                                <div className="glass-card p-8">
                                    <h3 className="text-2xl font-semibold mb-6">Coaching Effectiveness</h3>
                                    <div style={{ height: 300 }}>
                                    <Bar 
                                        data={{
                                            labels: ['Technique', 'Strategy', 'Mental', 'Physical'],
                                            datasets: [{
                                                label: 'Improvement Score',
                                                data: [85, 92, 78, 88],
                                                backgroundColor: '#0ea5e9',
                                                borderRadius: 8
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'top',
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    grid: {
                                                        color: 'rgba(255, 255, 255, 0.1)'
                                                    }
                                                },
                                                x: {
                                                    grid: {
                                                        color: 'rgba(255, 255, 255, 0.1)'
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                    </div>
                                </div>

                                <div className="glass-card p-8">
                                    <h3 className="text-2xl font-semibold mb-6">Skill Distribution</h3>
                                    <div style={{ height: 300 }}>
                                    <Radar
                                        data={{
                                            labels: ['Speed', 'Technique', 'Strategy', 'Endurance', 'Mental', 'Adaptability'],
                                            datasets: [{
                                                label: 'Current Level',
                                                data: [85, 90, 78, 82, 95, 88],
                                                backgroundColor: 'rgba(14, 165, 233, 0.2)',
                                                borderColor: '#0ea5e9',
                                                pointBackgroundColor: '#00F5D4'
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                r: {
                                                    angleLines: {
                                                        color: 'rgba(255, 255, 255, 0.1)'
                                                    },
                                                    grid: {
                                                        color: 'rgba(255, 255, 255, 0.1)'
                                                    },
                                                    pointLabels: {
                                                        font: {
                                                            size: 12
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mt-16">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold py-4 px-12 rounded-xl hover:scale-105 transition-all duration-300 shadow-xl text-lg"
                                >
                                    Access Full Analytics Dashboard
                                </button>
                                <p className="text-slate-400 mt-6 text-lg max-w-2xl mx-auto">
                                    Get comprehensive insights into player performance, coaching effectiveness, 
                                    and real-time analytics with our advanced dashboard
                                </p>
                            </div>
                        </motion.div>
                    </section>

                    {/* Additional Sections */}
                    {/* ... Continue with other sections ... */}
                </main>
        </div>
    );
};

export default EnhancedPitchDeck;
