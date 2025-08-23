import { useEffect, useRef, useState } from 'react';
import { NBadge, NCard } from '@nayan-ui/react';
import { ArrowLeft, ArrowRight, Github, Heart, Linkedin, Quote, Star, Twitter, Users } from 'lucide-react';

const Testimonials = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Senior Frontend Developer',
      company: 'TechFlow Inc.',
      avatar: 'SC',
      content:
        'This component library has transformed how we build interfaces. The components are beautifully designed, highly accessible, and incredibly easy to customize. Our development speed increased by 40%!',
      rating: 5,
      social: Twitter
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Product Designer',
      company: 'DesignLab',
      avatar: 'MR',
      content:
        'As a designer who works closely with developers, I love how this library bridges the gap between design and code. The components look exactly like our Figma designs!',
      rating: 5,
      social: Linkedin
    },
    {
      name: 'Emily Johnson',
      role: 'Full Stack Developer',
      company: 'StartupXYZ',
      avatar: 'EJ',
      content:
        'The React Native support is phenomenal. We built our mobile app in half the time using the same components from our web app. Consistency across platforms is amazing!',
      rating: 5,
      social: Github
    },
    {
      name: 'David Kim',
      role: 'Engineering Manager',
      company: 'ScaleUp Co.',
      avatar: 'DK',
      content:
        'This library helped our team maintain design consistency across multiple projects. The TypeScript support and documentation are top-notch. Highly recommended!',
      rating: 5,
      social: Twitter
    },
    {
      name: 'Lisa Wang',
      role: 'UX Engineer',
      company: 'InnovateTech',
      avatar: 'LW',
      content:
        'The accessibility features built into every component saved us weeks of work. Our app now meets WCAG standards without any extra effort from our side.',
      rating: 5,
      social: Linkedin
    }
  ];

  const stats = [
    { number: '10k+', label: 'Happy Developers' },
    { number: '500+', label: 'Companies' },
    { number: '50+', label: 'Countries' },
    { number: '99%', label: 'Satisfaction' }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-card/30 to-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary/3 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-500/3 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <NBadge className={`bg-primary/10 text-primary mb-4 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <Heart className="w-3 h-3 mr-1" />
            Testimonials
          </NBadge>
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            Loved by
            <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Developers Worldwide</span>
          </h2>
          <p
            className={`text-xl text-muted-foreground max-w-3xl mx-auto ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.4s' }}>
            Join thousands of developers and companies who trust modern component libraries to build their React and React Native applications. Here's
            what they have to say.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`text-center ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
              <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
              <div className="text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Testimonial */}
        <div className="relative mb-16">
          <NCard
            className={`p-8 lg:p-12 shadow-2xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '1s' }}>
            <div className="relative">
              {/* Quote Icon */}
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Quote className="w-8 h-8 text-primary" />
              </div>

              {/* Testimonial Content */}
              <div className="pl-8">
                <div className="mb-6">
                  <p className="text-xl lg:text-2xl leading-relaxed text-foreground mb-6">"{testimonials[currentTestimonial].content}"</p>

                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonials[currentTestimonial].avatar}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{testimonials[currentTestimonial].name}</div>
                      <div className="text-muted-foreground">{testimonials[currentTestimonial].role}</div>
                      <div className="text-primary font-medium">{testimonials[currentTestimonial].company}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </NCard>

          {/* Navigation */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <button
              onClick={prevTestimonial}
              className="w-12 h-12 bg-card hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl">
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Indicators */}
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-primary w-8' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="w-12 h-12 bg-card hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* All Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <NCard
              key={index}
              className={`p-6 group hover:shadow-xl transition-all duration-500 transform hover:scale-105 cursor-pointer ${
                index === currentTestimonial ? 'ring-2 ring-primary' : ''
              } ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${1.4 + index * 0.1}s` }}
              onClick={() => setCurrentTestimonial(index)}>
              <div className="space-y-4">
                {/* Quote */}
                <div className="relative">
                  <Quote className="w-8 h-8 text-primary/20 absolute -top-2 -left-2" />
                  <p className="text-sm leading-relaxed pl-4">"{testimonial.content.substring(0, 120)}..."</p>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Read full review
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </NCard>
          ))}
        </div>

        {/* Community Section */}
        <div className="mt-20 text-center">
          <div className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '2s' }}>
            <h3 className="text-2xl font-bold mb-4">Join Our Growing Community</h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with other developers, share your projects, and get help from the community.
            </p>

            <div className="flex justify-center items-center space-x-8">
              <div className="text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">5k+</div>
                <div className="text-sm text-muted-foreground">Discord Members</div>
              </div>

              <div className="text-center">
                <Github className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">1.2k</div>
                <div className="text-sm text-muted-foreground">GitHub Stars</div>
              </div>

              <div className="text-center">
                <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">100+</div>
                <div className="text-sm text-muted-foreground">Contributors</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
