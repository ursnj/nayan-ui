import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { NBadge, NButton, NCard } from '@nayan-ui/react';
import {
  ArrowRight,
  Bell,
  Calendar,
  Check,
  Code,
  Github,
  Heart,
  Mail,
  Palette,
  Rocket,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  User,
  Users,
  Zap
} from 'lucide-react';

const Banner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(65);
  const [isLoading, setIsLoading] = useState(false);
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

  // Simulate loading animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress > 100 ? 20 : newProgress;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleButtonClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-full blur-3xl animate-spin [animation-duration:20s]"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[600px]">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Badge */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-2 sm:space-y-0 sm:space-x-2 animate-fade-in-up delay-200">
              <NBadge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                New v2.0 Released
              </NBadge>
              <NBadge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                <Heart className="w-3 h-3 mr-1" />
                Open Source
              </NBadge>
            </div>

            {/* Main Heading */}
            <div className={`space-y-4 sm:space-y-6 ${isVisible ? 'animate-fade-in-up opacity-100 delay-400' : 'opacity-0'}`}>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">
                Build Beautiful
                <span className="block bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  React & React Native Components
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 px-4 sm:px-0">
                A comprehensive component library for React and React Native applications. Build faster, ship sooner, and create amazing user
                experiences with our production-ready components.
              </p>
            </div>

            {/* Stats */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-8 ${isVisible ? 'animate-fade-in-up opacity-100 delay-600' : 'opacity-0'}`}>
              <div className="flex items-center space-x-2">
                <Star className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-500" />
                <span className="text-sm sm:text-base font-semibold">50+ Components</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
                <span className="text-sm sm:text-base font-semibold">TypeScript Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <Palette className="w-4 sm:w-5 h-4 sm:h-5 text-purple-500" />
                <span className="text-sm sm:text-base font-semibold">Fully Customizable</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start ${isVisible ? 'animate-fade-in-up opacity-100 delay-800' : 'opacity-0'}`}>
              <Link to="/react/components" className="w-full sm:w-auto">
                <NButton className="group bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto">
                  <Rocket className="w-4 sm:w-5 h-4 sm:h-5 mr-2 group-hover:animate-pulse" />
                  Get Started
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </NButton>
              </Link>

              <Link to="/react-native/components" className="w-full sm:w-auto">
                <NButton
                  isOutline={true}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold transition-all duration-300 w-full sm:w-auto">
                  <Code className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                  View Components
                </NButton>
              </Link>
            </div>

            {/* GitHub Link */}
            <div className="animate-fade-in-up delay-1200">
              <a
                href="https://github.com/ursnj/nayan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors group">
                <Github className="w-4 sm:w-5 h-4 sm:h-5 group-hover:animate-pulse" />
                <span className="text-sm sm:text-base">Star us on GitHub</span>
                <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Right Content - Enhanced Interactive Demo */}
          <div
            className={`relative ${isVisible ? 'animate-fade-in-up opacity-100 delay-1000' : 'opacity-0'} mt-8 lg:mt-0 flex justify-center lg:justify-end`}>
            <div className="relative w-full max-w-md lg:max-w-lg space-y-4">
              {/* Main Demo Card */}
              <NCard className="p-4 sm:p-6 shadow-2xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-0 relative z-10">
                <div className="space-y-4">
                  {/* Demo Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Live Demo</div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex space-x-1 bg-background/50 rounded-lg p-1">
                    {['Buttons', 'Forms', 'Cards'].map((tab, index) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(index)}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                          activeTab === index ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="space-y-3">
                    {activeTab === 0 && (
                      <>
                        <NButton
                          onClick={handleButtonClick}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 transform hover:scale-[1.02]">
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <Zap className="w-4 h-4 mr-2" />
                          )}
                          {isLoading ? 'Loading...' : 'Interactive Button'}
                        </NButton>

                        <div className="grid grid-cols-2 gap-2">
                          <NButton
                            isOutline={true}
                            className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 text-sm">
                            <Check className="w-3 h-3 mr-1" />
                            Success
                          </NButton>
                          <NButton className="bg-red-500 hover:bg-red-600 text-white transition-all duration-300 text-sm">
                            <Shield className="w-3 h-3 mr-1" />
                            Danger
                          </NButton>
                        </div>
                      </>
                    )}

                    {activeTab === 1 && (
                      <>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search components..."
                              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="demo-check" className="rounded" />
                            <label htmlFor="demo-check" className="text-sm">
                              Enable notifications
                            </label>
                          </div>

                          <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                            <option>Choose framework</option>
                            <option>React</option>
                            <option>React Native</option>
                          </select>
                        </div>
                      </>
                    )}

                    {activeTab === 2 && (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">Profile</span>
                            </div>
                            <Settings className="w-4 h-4 text-muted-foreground" />
                          </div>

                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Bell className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium">Notifications</span>
                            </div>
                            <div className="w-8 h-4 bg-primary rounded-full relative">
                              <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5 transition-transform"></div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium">Schedule</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Today</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </NCard>

              {/* Progress Card */}
              <NCard className="p-4 sm:p-6 shadow-2xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-0 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Component Library</span>
                    <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-background/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="text-xs text-muted-foreground">Building amazing components...</div>
                </div>
              </NCard>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Code, label: 'TypeScript', color: 'bg-blue-500' },
                  { icon: Palette, label: 'Theming', color: 'bg-purple-500' },
                  { icon: Zap, label: 'Fast', color: 'bg-yellow-500' },
                  { icon: Shield, label: 'Secure', color: 'bg-green-500' }
                ].map((feature, index) => (
                  <div
                    key={feature.label}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-white text-xs ${feature.color} animate-fade-in-up`}
                    style={{ animationDelay: `${1.2 + index * 0.1}s` }}>
                    <feature.icon className="w-3 h-3" />
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-6 sm:w-8 h-6 sm:h-8 bg-primary rounded-full animate-bounce hidden lg:block"></div>
              <div className="absolute -bottom-4 -left-4 w-4 sm:w-6 h-4 sm:h-6 bg-purple-500 rounded-full animate-ping hidden lg:block"></div>
              <div className="absolute top-1/2 -right-8 w-3 h-3 bg-pink-500 rounded-full animate-pulse hidden lg:block"></div>
              <div className="absolute bottom-1/4 -left-8 w-2 h-2 bg-blue-500 rounded-full animate-bounce hidden lg:block"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
