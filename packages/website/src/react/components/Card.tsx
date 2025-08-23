import { useState } from 'react';
import { NCard } from '@nayan-ui/react';
import { Calendar, Download, Eye, Heart, MapPin, MessageCircle, MoreHorizontal, Share2, ShoppingCart, Star, User } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Card = () => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <ComponentWrapper>
      {/* Basic Cards */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Cards</h2>
        <p className="text-muted-foreground mb-4">Simple card layouts with different content types.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NCard className="p-6">
            <h3 className="text-lg font-semibold mb-2">Simple Card</h3>
            <p className="text-muted-foreground">This is a basic card with minimal content and clean styling.</p>
          </NCard>

          <NCard className="p-6 border-2 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-2 text-blue-600">Highlighted Card</h3>
            <p className="text-muted-foreground">This card has a colored border to draw attention.</p>
          </NCard>

          <NCard className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <h3 className="text-lg font-semibold mb-2">Gradient Card</h3>
            <p className="text-muted-foreground">This card features a subtle gradient background.</p>
          </NCard>
        </div>
      </div>

      {/* Profile Cards */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Profile Cards</h2>
        <p className="text-muted-foreground mb-4">Cards designed for displaying user profiles and information.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">JD</div>
              <div>
                <h3 className="text-lg font-semibold">John Doe</h3>
                <p className="text-muted-foreground text-sm">Software Engineer</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">Passionate developer with 5+ years of experience in React and TypeScript.</p>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600">Follow</button>
              <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Message</button>
            </div>
          </NCard>

          <NCard className="p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">AS</div>
              <h3 className="text-lg font-semibold mb-1">Alice Smith</h3>
              <p className="text-muted-foreground text-sm mb-2">UX Designer</p>
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>San Francisco</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined 2023</span>
                </div>
              </div>
              <div className="flex justify-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold">124</div>
                  <div className="text-muted-foreground">Projects</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">2.1k</div>
                  <div className="text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">180</div>
                  <div className="text-muted-foreground">Following</div>
                </div>
              </div>
            </div>
          </NCard>
        </div>
      </div>

      {/* Content Cards */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Content Cards</h2>
        <p className="text-muted-foreground mb-4">Cards for articles, blog posts, and media content.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NCard className="overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500"></div>
            <div className="p-6">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span>March 15, 2024</span>
                <span>•</span>
                <span>5 min read</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Getting Started with React Components</h3>
              <p className="text-muted-foreground mb-4">
                Learn how to build reusable and maintainable React components with modern best practices and TypeScript.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Sarah Johnson</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-2 rounded-full ${isLiked ? 'text-red-500' : 'text-muted-foreground'} hover:bg-gray-100 dark:hover:bg-gray-800`}>
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-2 rounded-full text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-full text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </NCard>

          <NCard className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Weekly Newsletter</h3>
                <p className="text-muted-foreground text-sm">Stay updated with the latest news</p>
              </div>
              <button className="p-1 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">New React 19 features announced</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">TypeScript 5.4 released with improvements</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Best practices for component testing</span>
              </div>
            </div>
            <button className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">Subscribe Now</button>
          </NCard>
        </div>
      </div>

      {/* Product Cards */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Product Cards</h2>
        <p className="text-muted-foreground mb-4">E-commerce style cards for products and services.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NCard className="overflow-hidden group cursor-pointer">
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Product Image</div>
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`p-2 rounded-full ${isBookmarked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600'} shadow-sm`}>
                  <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">Wireless Headphones</h3>
              <p className="text-muted-foreground text-sm mb-2">Premium noise-canceling headphones</p>
              <div className="flex items-center space-x-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-muted-foreground ml-1">(124 reviews)</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold">$299</span>
                  <span className="text-sm text-muted-foreground line-through ml-2">$399</span>
                </div>
                <button className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </div>
          </NCard>

          <NCard className="overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500"></div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">Smart Watch</h3>
              <p className="text-muted-foreground text-sm mb-2">Track your fitness and stay connected</p>
              <div className="flex items-center space-x-1 mb-2">
                {[1, 2, 3, 4].map(star => (
                  <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <Star className="w-4 h-4 text-gray-300" />
                <span className="text-sm text-muted-foreground ml-1">(89 reviews)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">$199</span>
                <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">Add to Cart</button>
              </div>
            </div>
          </NCard>

          <NCard className="overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500"></div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">Laptop Stand</h3>
              <p className="text-muted-foreground text-sm mb-2">Ergonomic aluminum laptop stand</p>
              <div className="flex items-center space-x-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-muted-foreground ml-1">(67 reviews)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">$79</span>
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">View Details</button>
              </div>
            </div>
          </NCard>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Statistics Cards</h2>
        <p className="text-muted-foreground mb-4">Cards for displaying metrics and key performance indicators.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Users</p>
                <p className="text-2xl font-bold">12,345</p>
                <p className="text-green-500 text-sm">+12% from last month</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </NCard>

          <NCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Page Views</p>
                <p className="text-2xl font-bold">98.2K</p>
                <p className="text-green-500 text-sm">+8% from last week</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </NCard>

          <NCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Downloads</p>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-red-500 text-sm">-3% from yesterday</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Download className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </NCard>

          <NCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Revenue</p>
                <p className="text-2xl font-bold">$45.2K</p>
                <p className="text-green-500 text-sm">+22% from last month</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <ShoppingCart className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </NCard>
        </div>
      </div>

      {/* Interactive Cards */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Interactive Cards</h2>
        <p className="text-muted-foreground mb-4">Cards with hover effects and click interactions.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105" onClick={() => alert('Card clicked!')}>
            <h3 className="text-lg font-semibold mb-2">Clickable Card</h3>
            <p className="text-muted-foreground mb-4">This entire card is clickable and shows hover effects.</p>
            <div className="flex items-center text-blue-500 text-sm font-medium">Learn more →</div>
          </NCard>

          <NCard className="p-6 group hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10 transition-all duration-300">
            <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">Hover Effect Card</h3>
            <p className="text-muted-foreground mb-4">This card changes appearance when you hover over it.</p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Get Started
            </button>
          </NCard>
        </div>
      </div>

      {/* Custom Styled Cards */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styled Cards</h2>
        <p className="text-muted-foreground mb-4">Cards with unique styling and layouts.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Featured Article</h3>
              <p className="text-muted-foreground mb-4">This card has a colorful top border to indicate special status.</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Published 2 days ago</span>
                <span>3 min read</span>
              </div>
            </div>
          </NCard>

          <NCard className="bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 text-white">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
              <p className="text-white/90 mb-4">This card uses a gradient background to highlight premium content.</p>
              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-md hover:bg-white/30 transition-colors">
                Upgrade Now
              </button>
            </div>
          </NCard>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Card;
