import { useEffect, useRef, useState } from 'react';
import { NCard } from '@nayan-ui/react';
import { Code, Download, Globe, Package, Shield, Star, Users, Zap } from 'lucide-react';

const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState({
    components: 0,
    downloads: 0,
    stars: 0,
    developers: 0
  });

  const sectionRef = useRef<HTMLElement>(null);

  const finalCounts = {
    components: 50,
    downloads: 100000,
    stars: 1200,
    developers: 500
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setCounts({
        components: Math.floor(finalCounts.components * easeOut),
        downloads: Math.floor(finalCounts.downloads * easeOut),
        stars: Math.floor(finalCounts.stars * easeOut),
        developers: Math.floor(finalCounts.developers * easeOut)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounts(finalCounts);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const stats = [
    {
      icon: Package,
      label: 'Components',
      value: counts.components,
      suffix: '+',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Ready-to-use components'
    },
    {
      icon: Download,
      label: 'Downloads',
      value: counts.downloads,
      suffix: '+',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'NPM downloads per month'
    },
    {
      icon: Star,
      label: 'GitHub Stars',
      value: counts.stars,
      suffix: '+',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Community appreciation'
    },
    {
      icon: Users,
      label: 'Developers',
      value: counts.developers,
      suffix: '+',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Active community members'
    }
  ];

  const features = [
    {
      icon: Code,
      title: 'TypeScript First',
      description: 'Built with TypeScript for better developer experience'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized for performance and bundle size'
    },
    {
      icon: Shield,
      title: 'Fully Accessible',
      description: 'WCAG compliant components out of the box'
    },
    {
      icon: Globe,
      title: 'Universal',
      description: 'Works with React and React Native'
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-background to-card/30">
      <div className="container mx-auto px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <NCard
              key={index}
              className={`p-6 text-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 0.2}s` }}>
              <div className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>

              <div className="space-y-2">
                <div className="text-3xl lg:text-4xl font-bold text-foreground">
                  {formatNumber(stat.value)}
                  {stat.suffix}
                </div>
                <div className="text-lg font-semibold text-foreground">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </div>
            </NCard>
          ))}
        </div>

        {/* Features Grid */}
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-bold mb-4 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
            Why Choose Nayan UI?
          </h2>
          <p
            className={`text-xl text-muted-foreground max-w-3xl mx-auto ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '1s' }}>
            Built by developers, for developers. Every component is crafted with attention to detail and best practices.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <NCard
              key={index}
              className={`p-6 text-center group hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${1.2 + index * 0.1}s` }}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>

              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </NCard>
          ))}
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-500/20 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-blue-500/30 rounded-full animate-bounce" style={{ animationDelay: '4s' }}></div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
