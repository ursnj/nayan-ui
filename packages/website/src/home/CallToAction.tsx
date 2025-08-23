import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { NBadge, NButton, NCard, NInput } from '@nayan-ui/react';
import { ArrowRight, BookOpen, Code, Github, Palette, Rocket, Shield, Smartphone, Sparkles, Star, Users, Zap } from 'lucide-react';

const CallToAction = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
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

  const features = [
    { icon: Zap, name: '50+ Components' },
    { icon: Star, name: 'TypeScript Support' },
    { icon: Users, name: 'React & React Native' },
    { icon: Sparkles, name: 'Production Ready' }
  ];

  const platforms = [
    {
      title: 'React Development',
      description: 'Build modern web applications with our React components',
      icon: Code,
      color: 'from-blue-500 to-cyan-500',
      link: '/react/components'
    },
    {
      title: 'React Native Development',
      description: 'Create native mobile apps with our React Native components',
      icon: Smartphone,
      color: 'from-green-500 to-emerald-500',
      link: '/react-native/components'
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Accessibility First',
      description: 'WCAG compliant components with proper ARIA attributes'
    },
    {
      icon: Palette,
      title: 'Customizable Design',
      description: 'Flexible theming system to match your brand identity'
    },
    {
      icon: Zap,
      title: 'Performance Optimized',
      description: 'Tree-shakable components optimized for production'
    },
    {
      icon: Star,
      title: 'Developer Experience',
      description: 'TypeScript support with comprehensive documentation'
    }
  ];

  return (
    <section ref={sectionRef} className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-card/30 to-background overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-48 sm:w-80 h-48 sm:h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>

        {/* Floating Elements - Hidden on mobile */}
        <div className="absolute top-20 right-4 sm:right-20 w-3 sm:w-4 h-3 sm:h-4 bg-primary rounded-full animate-bounce hidden sm:block"></div>
        <div className="absolute bottom-32 left-4 sm:left-16 w-2 sm:w-3 h-2 sm:h-3 bg-purple-500 rounded-full animate-ping hidden sm:block"></div>
        <div className="absolute top-1/2 right-8 w-1 sm:w-2 h-1 sm:h-2 bg-blue-500 rounded-full animate-pulse hidden sm:block"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <NBadge className={`bg-primary/10 text-primary mb-4 ${isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}>
            <Rocket className="w-3 h-3 mr-1" />
            Ready to Start
          </NBadge>

          <h2
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 sm:mb-8 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:0.2s]' : 'opacity-0'}`}>
            Choose Your
            <span className="block bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">Platform</span>
          </h2>

          <p
            className={`text-base sm:text-lg lg:text-xl xl:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8 sm:mb-12 px-4 sm:px-0 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:0.4s]' : 'opacity-0'}`}>
            Whether you're building for web or mobile, our component library provides everything you need to create beautiful, accessible, and
            performant applications.
          </p>

          {/* Feature Pills */}
          <div
            className={`flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 sm:mb-12 px-4 sm:px-0 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:0.6s]' : 'opacity-0'}`}>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-1 sm:space-x-2 bg-card px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-sm">
                <feature.icon className="w-3 sm:w-4 h-3 sm:h-4 text-primary flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{feature.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Selection */}
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {platforms.map((platform, index) => (
            <NCard
              key={index}
              className={`p-6 sm:p-8 text-center group hover:shadow-xl transition-all duration-500 transform hover:scale-105 ${
                isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'
              } ${index === 0 ? '[animation-delay:1.2s]' : '[animation-delay:1.4s]'}`}>
              <div className="space-y-4 sm:space-y-6">
                <div
                  className={`w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br ${platform.color} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                  <platform.icon className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                </div>

                <div>
                  <h4 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{platform.title}</h4>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2 sm:px-0">{platform.description}</p>
                </div>

                <Link to={platform.link} className="block">
                  <NButton className="bg-primary hover:bg-primary/90 text-primary-foreground w-full py-2 sm:py-3 text-sm sm:text-base">
                    Explore Components
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </NButton>
                </Link>
              </div>
            </NCard>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h3
              className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:1.6s]' : 'opacity-0'}`}>
              Why Choose Our Components?
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`text-center p-3 sm:p-6 ${isVisible ? `animate-fade-in-up opacity-100 [animation-delay:${2 + index * 0.1}s]` : 'opacity-0'}`}>
                <div className="w-12 sm:w-16 h-12 sm:h-16 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <benefit.icon className="w-6 sm:w-8 h-6 sm:h-8 text-primary" />
                </div>
                <h4 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">{benefit.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className={`flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4 sm:px-0 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:2.4s]' : 'opacity-0'}`}>
          <Link to="/react/components" className="w-full sm:w-auto">
            <NButton className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto">
              <Code className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              React Components
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
            </NButton>
          </Link>

          <Link to="/react-native/components" className="w-full sm:w-auto">
            <NButton
              isOutline={true}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transform hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Smartphone className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              React Native Components
            </NButton>
          </Link>

          <a href="https://github.com/ursnj/nayan-ui" target="_blank" rel="noopener noreferrer" className="inline-block w-full sm:w-auto">
            <NButton
              isOutline={true}
              className="border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-background px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transform hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Github className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              Star on GitHub
            </NButton>
          </a>
        </div>

        {/* Newsletter Signup */}
        <NCard className={`p-6 sm:p-8 lg:p-12 text-center ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:2.6s]' : 'opacity-0'}`}>
          <div className="max-w-2xl mx-auto">
            <Sparkles className="w-10 sm:w-12 h-10 sm:h-12 text-primary mx-auto mb-4 sm:mb-6" />
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Stay Updated</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-4 sm:px-0">
              Get notified about new components, updates, and best practices for React and React Native development. Join our newsletter for exclusive
              content and early access to new features.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
              <NInput
                wrapperClassName="mb-0"
                inputClassName="bg-background"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1"
              />
              <NButton className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-6 py-2 whitespace-nowrap">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </NButton>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">No spam, unsubscribe at any time. We respect your privacy.</p>
          </div>
        </NCard>

        {/* Final Message */}
        <div className={`text-center mt-12 sm:mt-16 ${isVisible ? 'animate-fade-in-up opacity-100 [animation-delay:2.8s]' : 'opacity-0'}`}>
          <p className="text-base sm:text-lg text-muted-foreground">Ready to elevate your development experience?</p>
          <p className="text-xl sm:text-2xl font-bold mt-2">Let's build something amazing together! 🚀</p>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
