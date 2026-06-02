'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    title: "Designwire Luxury Design Media",
    tags: "Web Design, Web Development, SEO",
    metric: "2M+ Followers",
    imgSrc: "https://cdn.prod.website-files.com/69f4b9873c97d7dd1b0d41e1/6a00a924517390c22f6cd1f8_web.avif",
    link: "https://designwire.eu/"
  },
  {
    title: "Bovia B2B Manufacturing",
    tags: "Branding, Web Design, Web Development, SEO",
    metric: "",
    imgSrc: "https://cdn.prod.website-files.com/69f4b9873c97d7dd1b0d41e1/6a14b5a7338e007af727af52_bovia%20web.webp",
    link: "https://bovia.co/"
  },
  {
    title: "Mr. Noodle Chen",
    tags: "Web Design, Web Development, SEO",
    metric: "28K Clicks",
    imgSrc: "https://cdn.prod.website-files.com/69f4b9873c97d7dd1b0d41e1/6a15a9a78f47dfbcaa6eeee7_restaurant_wordpress_website_design1%20(2).webp",
    link: "https://mrnoodlechen.de/"
  }
];

export default function SelectedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title reveal
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } }
      );

      // Staggered reveal for projects
      itemsRef.current.forEach((item, index) => {
        if (!item) return;
        
        const imageWrapper = item.querySelector('.image-wrapper');
        const image = item.querySelector('.project-image');
        
        // Item reveal
        gsap.fromTo(item, 
          { opacity: 0, y: 100 }, 
          { opacity: 1, y: 0, duration: 1, delay: index * 0.1, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 85%' } }
        );

        // Parallax image scroll
        if (imageWrapper && image) {
          gsap.fromTo(image,
            { y: '-10%' },
            { 
              y: '10%',
              ease: 'none',
              scrollTrigger: {
                trigger: imageWrapper,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
              }
            }
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full bg-brand-dark px-8 py-32 text-white">
      <div className="max-w-7xl mx-auto">
        <h3 ref={titleRef} className="text-4xl md:text-5xl lg:text-6xl font-serif italic text-center mb-24 text-[#888888]">
          SELECTED WORK
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-24">
          {projects.map((project, idx) => {
            const isFullWidth = idx === 0;
            return (
              <div 
                key={idx} 
                ref={el => { itemsRef.current[idx] = el; }} 
                className={`flex flex-col gap-6 ${isFullWidth ? 'md:col-span-2' : ''}`}
              >
                <a 
                  href={project.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-cursor="View Work"
                  className="image-wrapper block relative w-full overflow-hidden group"
                  style={{ aspectRatio: isFullWidth ? '16/9' : '4/5' }}
                >
                  <img 
                    src={project.imgSrc} 
                    alt={project.title} 
                    className="project-image absolute inset-0 w-full h-[120%] object-cover top-[-10%] transition-transform duration-700 ease-out group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                </a>

                <div className="flex justify-between items-start w-full">
                  <div>
                    <h4 className="text-2xl font-serif text-[#f2f3ee] mb-2">{project.title}</h4>
                    <p className="text-xs font-sans tracking-widest text-[#888888] uppercase">{project.tags}</p>
                  </div>
                  {project.metric && (
                    <h5 className="text-2xl font-serif italic text-[#888888] text-right whitespace-nowrap">
                      {project.metric}
                    </h5>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
