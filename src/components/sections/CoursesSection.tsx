import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Brain,
  Code2,
  Database,
  Cloud,
  Layout,
  Palette,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import EnrollmentForm from '../ui/EnrollmentForm';

gsap.registerPlugin(ScrollTrigger);

const courses = [
  {
    id: 1,
    title: "Artificial Intelligence & Machine Learning",
    description: "Build intelligent solutions. Shape the future.",
    icon: <Brain className="w-8 h-8 text-accent" />,
    modules: [
      "Python for AI & ML",
      "Data Analysis & Visualization",
      "Machine Learning Algorithms",
      "Deep Learning (Neural Networks)",
      "AI Tools & Techniques",
      "Model Evaluation & Deployment",
      "Capstone AI Project"
    ],
    color: "from-purple-500/20 to-blue-500/20"
  },
  {
    id: 2,
    title: "C / C++ Programming",
    description: "Build strong logic. Code your future.",
    icon: <Code2 className="w-8 h-8 text-accent" />,
    modules: [
      "Fundamentals to Advanced",
      "Data Structures",
      "OOP Concepts",
      "File Handling",
      "Pointers & Functions",
      "Problem Solving",
      "Mini Projects"
    ],
    color: "from-blue-500/20 to-teal-500/20"
  },
  {
    id: 3,
    title: "Database Management System",
    description: "Manage data. Drive decisions.",
    icon: <Database className="w-8 h-8 text-accent" />,
    modules: [
      "DBMS Fundamentals",
      "SQL & Query Writing",
      "Normalization",
      "ER Diagrams",
      "Database Design",
      "Transactions & Concurrency",
      "Mini Projects"
    ],
    color: "from-green-500/20 to-emerald-500/20"
  },
  {
    id: 4,
    title: "Cloud Computing",
    description: "Learn cloud. Build without limits.",
    icon: <Cloud className="w-8 h-8 text-accent" />,
    modules: [
      "Cloud Fundamentals",
      "AWS / Azure Basics",
      "Virtual Machines",
      "Storage & Networking",
      "Security & Identity",
      "Cloud Deployment",
      "Real World Projects"
    ],
    color: "from-cyan-500/20 to-blue-500/20"
  },
  {
    id: 5,
    title: "Microsoft Office Business",
    description: "Work smart. Achieve more.",
    icon: <Layout className="w-8 h-8 text-accent" />,
    modules: [
      "MS Word Mastery",
      "Advanced MS Excel",
      "PowerPoint Presentation",
      "MS Outlook & Productivity",
      "Data Analysis in Excel",
      "Business Automation",
      "Office Cloud Integration"
    ],
    color: "from-orange-500/20 to-red-500/20"
  },
  {
    id: 6,
    title: "Graphic Designing",
    description: "Design your ideas. Create impact.",
    icon: <Palette className="w-8 h-8 text-accent" />,
    modules: [
      "Adobe Photoshop",
      "Adobe Illustrator",
      "CorelDRAW Basics",
      "Poster & Banner Design",
      "Social Media Graphics",
      "Brand Identity Design",
      "Real World Client Projects"
    ],
    color: "from-pink-500/20 to-rose-500/20"
  }
];

export default function CoursesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useGSAP(() => {
    console.log("CoursesSection mounted, courses:", courses);
    /*
    gsap.from('.course-header-reveal', {
      scrollTrigger: {
        trigger: '.course-header-reveal',
        start: 'top 90%',
      },
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power4.out',
    });

    gsap.from('.course-card', {
      scrollTrigger: {
        trigger: '.course-grid',
        start: 'top 80%',
      },
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power3.out',
    });
    */
  }, { scope: containerRef });

  const handleEnroll = (courseTitle: string) => {
    setSelectedCourse(courseTitle);
    setIsFormOpen(true);
  };

  return (
    <section id="courses" className="relative w-full py-32 bg-transparent overflow-hidden px-8" ref={containerRef}>
      <div className="max-w-screen-2xl mx-auto mb-20 flex flex-col items-start px-4">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-6 block course-header-reveal">
          05 / ACADEMY
        </span>
        <div className="flex flex-col leading-[0.8] course-header-reveal">
          <h2 className="text-[15vw] md:text-[10vw] font-black uppercase text-white tracking-tighter">
            Our Courses
          </h2>
          <p className="text-zinc-500 mt-8 max-w-xl text-lg font-medium leading-relaxed tracking-tight" style={{ lineHeight: '1.4' }}>
            Master the most in-demand skills in the tech industry with our expert-led, practical training programs.
          </p>
        </div>
      </div>

      <div className="course-grid max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`course-card group relative flex flex-col rounded-3xl overflow-hidden border border-white/5 bg-zinc-950/20 backdrop-blur-2xl transition-all duration-500 hover:border-accent/30 p-8`}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-accent/10 transition-colors duration-500">
                  {course.icon}
                </div>
                <span className="text-4xl font-black text-white/5 group-hover:text-white/10 transition-colors duration-500 select-none">
                  0{course.id}
                </span>
              </div>

              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 pr-10 leading-tight">
                {course.title}
              </h3>

              <p className="text-zinc-400 text-sm mb-8 group-hover:text-zinc-300 transition-colors duration-500 line-clamp-2">
                {course.description}
              </p>

              <div className="space-y-3 mb-10 flex-grow">
                {course.modules.slice(0, 5).map((module, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-zinc-500 group-hover:text-zinc-300 transition-colors duration-500">
                    <CheckCircle2 className="w-4 h-4 text-accent/50" />
                    <span className="text-xs font-medium tracking-tight truncate">{module}</span>
                  </div>
                ))}
                {course.modules.length > 5 && (
                  <div className="text-[10px] text-zinc-600 pl-7 font-mono">+ AND MORE</div>
                )}
              </div>

              <button
                onClick={() => handleEnroll(course.title)}
                className="group/btn relative w-full bg-accent text-zinc-950 font-black uppercase text-xs tracking-widest py-5 rounded-2xl overflow-hidden transition-transform duration-300 active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Enroll Now
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Why Choose Us Section Placeholder or Integration */}
      <div className="max-w-screen-2xl mx-auto mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 px-4 opacity-50">
        {[
          { label: "Practical Training", value: "Hands-on Experience" },
          { label: "Expert Instructors", value: "Industry Professionals" },
          { label: "Job Ready Skills", value: "Career Focused" },
          { label: "Certification", value: "Official Recognition" }
        ].map((item, i) => (
          <div key={i} className="flex flex-col gap-2">
            <span className="text-[8px] font-mono uppercase text-accent tracking-[0.3em]">{item.label}</span>
            <span className="text-xs text-white font-bold">{item.value}</span>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <EnrollmentForm
          courseName={selectedCourse || ""}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </section>
  );
}
