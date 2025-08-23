import { useEffect, useMemo, useRef, useState } from 'react';
import { NBadge, NCard } from '@nayan-ui/react';
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  Blocks,
  BookOpenText,
  Code,
  Compass,
  FerrisWheel,
  GitCompare,
  Globe,
  HandCoins,
  LayoutGrid,
  Monitor,
  MonitorSmartphone,
  PackageCheck,
  Palette,
  PencilRuler,
  Rocket,
  ShieldEllipsis,
  Slack,
  Smartphone,
  Sparkles,
  Zap
} from 'lucide-react';

const Features = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mainFeatures = useMemo(
    () => [
      {
        title: 'Universal Components',
        subtitle: 'Write once, use everywhere',
        description: 'Write once, use everywhere. Our components work seamlessly across web and mobile platforms.',
        icon: Smartphone,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50',
        features: ['Shared API', 'Platform Optimized', 'Consistent UX', 'Single Codebase']
      },
      {
        title: 'Developer Experience',
        subtitle: 'Built for Productivity',
        description: 'Built with TypeScript, comprehensive documentation, and intuitive APIs for faster development.',
        icon: Code,
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-50',
        features: ['TypeScript', 'IntelliSense', 'Documentation', 'Error Handling']
      },
      {
        title: 'Design System',
        subtitle: 'Your Brand, Your Style',
        description: 'Consistent design language with customizable themes and accessibility built-in from the ground up.',
        icon: Palette,
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-50',
        features: ['CSS Variables', 'Dark Mode', 'Custom Tokens', 'Brand Colors']
      },
      {
        title: 'Performance First',
        subtitle: 'Optimized for Speed',
        description: 'Optimized components with minimal bundle size and maximum performance for production apps.',
        icon: Zap,
        color: 'from-orange-500 to-red-500',
        bgColor: 'bg-orange-50',
        features: ['Tree Shaking', 'Lazy Loading', 'Minimal Bundle Size', 'Maximum Performance']
      }
    ],
    []
  );

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

  // Auto-play functionality
  useEffect(() => {
    if (isPausedByUser) return;

    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % mainFeatures.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [mainFeatures.length, isPausedByUser]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  const prevFeature = () => {
    console.log('Previous clicked, current:', currentFeature);
    setIsPausedByUser(true);
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPausedByUser(false);
    }, 8000);
    setCurrentFeature(prev => {
      const newIndex = (prev - 1 + mainFeatures.length) % mainFeatures.length;
      console.log('Setting to:', newIndex);
      return newIndex;
    });
  };

  const nextFeature = () => {
    console.log('Next clicked, current:', currentFeature);
    setIsPausedByUser(true);
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPausedByUser(false);
    }, 8000);
    setCurrentFeature(prev => {
      const newIndex = (prev + 1) % mainFeatures.length;
      console.log('Setting to:', newIndex);
      return newIndex;
    });
  };

  const allFeatures = [
    {
      title: 'Reusable Components',
      text: 'Pre-designed and pre-implemented UI components such as buttons, forms, modals, navigation menus, and more.',
      icon: FerrisWheel,
      category: 'Components'
    },
    {
      title: 'Customization',
      text: 'Customize appearance and behavior through props, theming, or CSS-in-JS solutions to match your requirements.',
      icon: PencilRuler,
      category: 'Styling'
    },
    {
      title: 'Consistency',
      text: 'Promotes design consistency across applications with the same set of components and consistent behavior.',
      icon: PackageCheck,
      category: 'Design'
    },
    {
      title: 'Performance',
      text: 'Optimized for performance with tree-shaking, lazy loading, and minimal bundle size impact.',
      icon: Zap,
      category: 'Performance'
    },
    {
      title: 'Documentation',
      text: 'Comprehensive documentation with examples, props, and guidelines for best practices and integration.',
      icon: BookOpenText,
      category: 'Developer'
    },
    {
      title: 'Community',
      text: 'Active community support with regular updates, bug fixes, and feature requests from developers worldwide.',
      icon: Globe,
      category: 'Support'
    }
  ];

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-card/30 to-background">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-48 sm:w-80 h-48 sm:h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse [animation-delay:3s]"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <NBadge className={`bg-primary/10 text-primary mb-4 ${isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}>
            <Sparkles className="w-3 h-3 mr-1" />
            Features
          </NBadge>
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:0.2s]' : 'opacity-0'}`}>
            Everything You Need to
            <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Build Amazing Apps</span>
          </h2>
          <p
            className={`text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:0.4s]' : 'opacity-0'}`}>
            Discover the power of unified development. Build once, deploy everywhere with components designed for modern React and React Native
            applications.
          </p>
        </div>

        {/* Main Features Carousel */}
        <div className="mb-16 sm:mb-20">
          <div className={`relative ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:0.6s]' : 'opacity-0'}`}>
            {/* Only render the current feature */}
            <div className="transition-all duration-500 opacity-100 transform translate-y-0">
              <NCard className="p-4 sm:p-6 lg:p-8 xl:p-12 shadow-2xl border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      {(() => {
                        const IconComponent = mainFeatures[currentFeature].icon;
                        return (
                          <div
                            className={`w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gradient-to-br ${mainFeatures[currentFeature].color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <IconComponent className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                          </div>
                        );
                      })()}
                      <div>
                        <h4 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">{mainFeatures[currentFeature].title}</h4>
                        <p className="text-sm sm:text-base text-muted-foreground">{mainFeatures[currentFeature].subtitle}</p>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                      {mainFeatures[currentFeature].description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {mainFeatures[currentFeature].features.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                          <span className="text-xs sm:text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative mt-6 lg:mt-0">
                    {(() => {
                      const IconComponent = mainFeatures[currentFeature].icon;
                      return (
                        <div
                          className={`w-full h-48 sm:h-64 lg:h-80 ${mainFeatures[currentFeature].bgColor} rounded-2xl sm:rounded-3xl flex items-center justify-center relative overflow-hidden`}>
                          <IconComponent className="w-16 sm:w-24 lg:w-32 h-16 sm:h-24 lg:h-32 text-gray-300 opacity-20" />
                          {/* Animated Elements */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="grid grid-cols-2 gap-2 sm:gap-4 p-4 sm:p-8">
                              {[1, 2, 3, 4].map(item => (
                                <div
                                  key={item}
                                  className="w-8 sm:w-12 lg:w-16 h-8 sm:h-12 lg:h-16 bg-white/80 rounded-lg sm:rounded-xl shadow-lg animate-pulse"
                                  style={{ animationDelay: `${item * 0.2}s` }}></div>
                              ))}
                            </div>
                          </div>

                          {/* Floating Elements - Hidden on mobile */}
                          <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-4 sm:w-6 lg:w-8 h-4 sm:h-6 lg:h-8 bg-primary rounded-full animate-bounce hidden sm:block"></div>
                          <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 w-3 sm:w-4 lg:w-6 h-3 sm:h-4 lg:h-6 bg-purple-500 rounded-full animate-ping hidden sm:block"></div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </NCard>
            </div>

            {/* Navigation */}
            <div className="flex justify-center items-center space-x-4 mt-6 sm:mt-8">
              <button
                onClick={prevFeature}
                className="w-8 sm:w-10 h-8 sm:h-10 bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center transition-all">
                <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>

              <div className="flex space-x-2">
                {mainFeatures.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsPausedByUser(true);
                      clearTimeout(resumeTimeoutRef.current);
                      resumeTimeoutRef.current = setTimeout(() => {
                        setIsPausedByUser(false);
                      }, 8000);
                      setCurrentFeature(index);
                    }}
                    className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full transition-all ${
                      index === currentFeature ? 'bg-primary w-6 sm:w-8' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextFeature}
                className="w-8 sm:w-10 h-8 sm:h-10 bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center transition-all">
                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* All Features Grid */}
        <div className="space-y-8 sm:space-y-12">
          <div className="text-center">
            <h3
              className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:0.8s]' : 'opacity-0'}`}>
              Complete Feature Set
            </h3>
            <p
              className={`text-sm sm:text-base lg:text-lg text-muted-foreground px-4 sm:px-0 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:1s]' : 'opacity-0'}`}>
              Everything you need for modern application development
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {allFeatures.map((feature, index) => (
              <NCard
                key={index}
                className={`p-4 sm:p-6 group hover:shadow-xl transition-all duration-500 transform hover:scale-105 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary ${
                  isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'
                } ${index < 3 ? '[animation-delay:1.4s]' : index < 6 ? '[animation-delay:1.5s]' : '[animation-delay:1.6s]'}`}>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <feature.icon className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
                  </div>

                  <div className="flex-1 space-y-1 sm:space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                      <h4 className="text-sm sm:text-base lg:text-lg font-semibold group-hover:text-primary transition-colors">{feature.title}</h4>
                      <NBadge className="text-xs bg-muted text-muted-foreground self-start sm:self-auto">{feature.category}</NBadge>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.text}</p>

                    <div className="flex items-center text-primary text-xs sm:text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more
                      <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </NCard>
            ))}
          </div>
        </div>

        {/* Platform Support */}
        <div className="mt-16 sm:mt-20">
          <NCard
            className={`p-6 sm:p-8 bg-gradient-to-br from-primary/5 to-purple-500/5 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:1.8s]' : 'opacity-0'}`}>
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Cross-Platform Excellence</h3>
              <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 bg-blue-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Monitor className="w-6 sm:w-8 h-6 sm:h-8 text-blue-500" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="font-bold text-sm sm:text-base">React Web</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Modern web applications with server-side rendering support</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 bg-green-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-6 sm:w-8 h-6 sm:h-8 text-green-500" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="font-bold text-sm sm:text-base">React Native</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Native mobile apps for iOS and Android platforms</p>
                  </div>
                </div>
              </div>
            </div>
          </NCard>
        </div>

        {/* Floating Animation Elements - Hidden on mobile */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-primary/30 rounded-full animate-ping [animation-delay:1s] hidden sm:block"></div>
        <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-purple-500/30 rounded-full animate-bounce [animation-delay:2s] hidden sm:block"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-blue-500/30 rounded-full animate-bounce [animation-delay:4s] hidden sm:block"></div>
      </div>
    </section>
  );
};

export default Features;
