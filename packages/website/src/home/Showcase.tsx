import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { NBadge, NButton, NCard } from '@nayan-ui/react';
import { ArrowRight, Code, Download, Eye, Heart, Layout, Palette, Settings, Shield, Smartphone, Sparkles, Star, Users, Zap } from 'lucide-react';

const Showcase = () => {
  const [isVisible, setIsVisible] = useState(false);
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

  const developmentBenefits = [
    {
      icon: Code,
      title: 'Developer Experience',
      description: 'TypeScript support, comprehensive documentation, and intuitive APIs'
    },
    {
      icon: Smartphone,
      title: 'Cross-Platform',
      description: 'Same components work seamlessly across web and mobile platforms'
    },
    {
      icon: Shield,
      title: 'Accessibility First',
      description: 'WCAG compliant components with proper ARIA attributes and keyboard navigation'
    },
    {
      icon: Zap,
      title: 'Performance Optimized',
      description: 'Tree-shakable, lightweight components optimized for production use'
    }
  ];

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-card/30">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-48 sm:w-72 h-48 sm:h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <NBadge className={`bg-primary/10 text-primary mb-4 ${isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}>
            <Eye className="w-3 h-3 mr-1" />
            Showcase
          </NBadge>
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:0.2s]' : 'opacity-0'}`}>
            Comprehensive
            <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Component Library</span>
          </h2>
          <p
            className={`text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:0.4s]' : 'opacity-0'}`}>
            Discover our extensive collection of components designed for modern React and React Native development. Each component is crafted with
            performance, accessibility, and developer experience in mind.
          </p>
        </div>

        {/* Development Benefits */}
        <div className="space-y-8 sm:space-y-12">
          <div className="text-center">
            <h3
              className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:0.8s]' : 'opacity-0'}`}>
              Why Choose Modern Components?
            </h3>
            <p
              className={`text-sm sm:text-base lg:text-lg text-muted-foreground px-4 sm:px-0 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:1s]' : 'opacity-0'}`}>
              Built for developers who value quality, performance, and great user experience
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {developmentBenefits.map((benefit, index) => (
              <NCard
                key={index}
                className={`p-4 sm:p-6 group hover:shadow-lg transition-all duration-300 ${
                  isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'
                } ${index === 0 ? '[animation-delay:1.2s]' : index === 1 ? '[animation-delay:1.3s]' : index === 2 ? '[animation-delay:1.4s]' : '[animation-delay:1.5s]'}`}>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <benefit.icon className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base lg:text-lg font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                      {benefit.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </NCard>
            ))}
          </div>
        </div>

        {/* Platform Support */}
        <div className="mt-16 sm:mt-20">
          <NCard
            className={`p-6 sm:p-8 bg-gradient-to-br from-primary/5 to-purple-500/5 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:2s]' : 'opacity-0'}`}>
            <div className="text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <Code className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
                  <span className="font-semibold text-sm sm:text-base">React</span>
                </div>
                <div className="text-2xl text-muted-foreground/30 hidden sm:block">+</div>
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
                  <span className="font-semibold text-sm sm:text-base">React Native</span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">One Library, Two Platforms</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-6 px-4 sm:px-0">
                Our components are designed to work seamlessly across both web and mobile platforms, giving you the flexibility to build consistent
                user experiences everywhere.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center space-y-6 sm:space-y-0 sm:space-x-8">
                <div className="text-center">
                  <Users className="w-6 sm:w-8 h-6 sm:h-8 text-primary mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-bold">50+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Components</div>
                </div>

                <div className="text-center">
                  <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-primary mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-bold">100%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Accessible</div>
                </div>

                <div className="text-center">
                  <Star className="w-6 sm:w-8 h-6 sm:h-8 text-primary mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-bold">TypeScript</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
          </NCard>
        </div>

        {/* Call to Action */}
        <div className={`text-center mt-12 sm:mt-16 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:2.2s]' : 'opacity-0'}`}>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link to="/react/components" className="w-full sm:w-auto">
              <NButton className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold w-full sm:w-auto">
                <Eye className="w-4 h-4 mr-2" />
                Explore React Components
                <ArrowRight className="w-4 h-4 ml-2" />
              </NButton>
            </Link>
            <Link to="/react-native/components" className="w-full sm:w-auto">
              <NButton
                isOutline={true}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold w-full sm:w-auto">
                <Smartphone className="w-4 h-4 mr-2" />
                Explore React Native Components
              </NButton>
            </Link>
          </div>
        </div>

        {/* Floating Animation Elements - Hidden on mobile */}
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-ping [animation-delay:1s] hidden sm:block"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-purple-500/30 rounded-full animate-bounce [animation-delay:3s] hidden sm:block"></div>
      </div>
    </section>
  );
};

export default Showcase;
