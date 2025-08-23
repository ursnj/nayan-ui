import { useCallback, useState } from 'react';
import { NBadge, NCard, NInfiniteScroll, NLoading } from '@nayan-ui/react';
import { Calendar, Clock, FileText, Heart, Image, MessageCircle, Share, Star, User, Video } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
  type: 'text' | 'image' | 'video';
}

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  image: string;
  category: string;
}

interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

const InfiniteScroll = () => {
  // Basic Infinite Scroll
  const [basicItems, setBasicItems] = useState(new Array(10).fill('').map((_, i) => i + 1));
  const [basicFetching, setBasicFetching] = useState(false);

  // Social Feed
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      title: 'Getting Started with React',
      content: 'React is a powerful library for building user interfaces. Here are some tips to get started...',
      author: 'John Doe',
      date: '2024-01-15',
      likes: 42,
      comments: 8,
      type: 'text'
    },
    {
      id: 2,
      title: 'Beautiful Sunset Photography',
      content: 'Captured this amazing sunset during my trip to the mountains. Nature never fails to amaze!',
      author: 'Jane Smith',
      date: '2024-01-14',
      likes: 156,
      comments: 23,
      type: 'image'
    }
  ]);
  const [postsFetching, setPostsFetching] = useState(false);

  // Product Catalog
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Wireless Headphones',
      price: 99.99,
      rating: 4.5,
      image: 'headphones.jpg',
      category: 'Electronics'
    },
    {
      id: 2,
      name: 'Coffee Mug',
      price: 15.99,
      rating: 4.2,
      image: 'mug.jpg',
      category: 'Kitchen'
    }
  ]);
  const [productsFetching, setProductsFetching] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      message: 'Your order has been shipped',
      type: 'success',
      timestamp: '2 minutes ago',
      read: false
    },
    {
      id: 2,
      message: 'New comment on your post',
      type: 'info',
      timestamp: '5 minutes ago',
      read: false
    }
  ]);
  const [notificationsFetching, setNotificationsFetching] = useState(false);

  // Custom loading states
  const [customItems, setCustomItems] = useState(new Array(8).fill('').map((_, i) => i + 1));
  const [customFetching, setCustomFetching] = useState(false);

  const fetchBasicItems = useCallback(() => {
    if (basicFetching) return;
    setBasicFetching(true);

    setTimeout(() => {
      const newItems = new Array(10).fill('').map((_, i) => basicItems.length + i + 1);
      setBasicItems(prev => [...prev, ...newItems]);
      setBasicFetching(false);
    }, 1500);
  }, [basicItems.length, basicFetching]);

  const fetchPosts = useCallback(() => {
    if (postsFetching) return;
    setPostsFetching(true);

    setTimeout(() => {
      const newPosts: Post[] = [
        {
          id: posts.length + 1,
          title: `New Post ${posts.length + 1}`,
          content: 'This is a dynamically loaded post with interesting content...',
          author: `User ${Math.floor(Math.random() * 100)}`,
          date: new Date().toISOString().split('T')[0],
          likes: Math.floor(Math.random() * 200),
          comments: Math.floor(Math.random() * 50),
          type: ['text', 'image', 'video'][Math.floor(Math.random() * 3)] as 'text' | 'image' | 'video'
        },
        {
          id: posts.length + 2,
          title: `Another Post ${posts.length + 2}`,
          content: 'More engaging content for your feed...',
          author: `User ${Math.floor(Math.random() * 100)}`,
          date: new Date().toISOString().split('T')[0],
          likes: Math.floor(Math.random() * 200),
          comments: Math.floor(Math.random() * 50),
          type: ['text', 'image', 'video'][Math.floor(Math.random() * 3)] as 'text' | 'image' | 'video'
        }
      ];
      setPosts(prev => [...prev, ...newPosts]);
      setPostsFetching(false);
    }, 2000);
  }, [posts.length, postsFetching]);

  const fetchProducts = useCallback(() => {
    if (productsFetching) return;
    setProductsFetching(true);

    setTimeout(() => {
      const categories = ['Electronics', 'Kitchen', 'Books', 'Clothing', 'Sports'];
      const productNames = ['Smart Watch', 'Laptop Stand', 'Water Bottle', 'Notebook', 'Phone Case'];

      const newProducts: Product[] = [
        {
          id: products.length + 1,
          name: productNames[Math.floor(Math.random() * productNames.length)],
          price: Math.floor(Math.random() * 200) + 10,
          rating: Math.floor(Math.random() * 50) / 10,
          image: `product${products.length + 1}.jpg`,
          category: categories[Math.floor(Math.random() * categories.length)]
        },
        {
          id: products.length + 2,
          name: productNames[Math.floor(Math.random() * productNames.length)],
          price: Math.floor(Math.random() * 200) + 10,
          rating: Math.floor(Math.random() * 50) / 10,
          image: `product${products.length + 2}.jpg`,
          category: categories[Math.floor(Math.random() * categories.length)]
        }
      ];
      setProducts(prev => [...prev, ...newProducts]);
      setProductsFetching(false);
    }, 1800);
  }, [products.length, productsFetching]);

  const fetchNotifications = useCallback(() => {
    if (notificationsFetching) return;
    setNotificationsFetching(true);

    setTimeout(() => {
      const messages = ['Your profile was viewed', 'New follower added', 'Payment received', 'System maintenance scheduled', 'New feature available'];
      const types: ('info' | 'success' | 'warning' | 'error')[] = ['info', 'success', 'warning', 'error'];

      const newNotifications: Notification[] = [
        {
          id: notifications.length + 1,
          message: messages[Math.floor(Math.random() * messages.length)],
          type: types[Math.floor(Math.random() * types.length)],
          timestamp: `${Math.floor(Math.random() * 60)} minutes ago`,
          read: Math.random() > 0.7
        }
      ];
      setNotifications(prev => [...prev, ...newNotifications]);
      setNotificationsFetching(false);
    }, 1200);
  }, [notifications.length, notificationsFetching]);

  const fetchCustomItems = useCallback(() => {
    if (customFetching) return;
    setCustomFetching(true);

    setTimeout(() => {
      const newItems = new Array(6).fill('').map((_, i) => customItems.length + i + 1);
      setCustomItems(prev => [...prev, ...newItems]);
      setCustomFetching(false);
    }, 2500);
  }, [customItems.length, customFetching]);

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <ComponentWrapper>
      {/* Basic Infinite Scroll */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Infinite Scroll</h2>
        <p className="text-muted-foreground mb-4">Simple infinite scroll with basic items and loading state.</p>

        <div className="max-w-md mx-auto border rounded-lg p-4 max-h-96 overflow-hidden">
          <NInfiniteScroll
            next={fetchBasicItems}
            hasMore={basicItems.length < 50}
            loader={
              <div className="text-center py-4">
                <NLoading />
              </div>
            }
            dataLength={basicItems.length}
            scrollThreshold={0.95}>
            {basicItems.map((item, index) => (
              <NCard key={index} className="p-4 mb-3 bg-card">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Item {item}</span>
                  <NBadge className="bg-blue-100 text-blue-800">#{item}</NBadge>
                </div>
              </NCard>
            ))}
          </NInfiniteScroll>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Loaded: {basicItems.length} items</p>
            <p>Has more: {basicItems.length < 50 ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Social Media Feed */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Social Media Feed</h2>
        <p className="text-muted-foreground mb-4">Infinite scroll for social media posts with rich content.</p>

        <div className="max-w-2xl mx-auto border rounded-lg max-h-96 overflow-hidden">
          <NInfiniteScroll
            next={fetchPosts}
            hasMore={posts.length < 20}
            loader={
              <div className="text-center py-6">
                <NLoading />
                <p className="text-sm text-muted-foreground mt-2">Loading more posts...</p>
              </div>
            }
            dataLength={posts.length}
            scrollThreshold={0.9}>
            {posts.map(post => (
              <NCard key={post.id} className="p-6 m-4 border-b">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold">{post.author}</h3>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </span>
                      <div className="flex items-center gap-1">
                        {getPostIcon(post.type)}
                        <span className="text-xs text-muted-foreground capitalize">{post.type}</span>
                      </div>
                    </div>

                    <h4 className="font-medium mb-2">{post.title}</h4>
                    <p className="text-muted-foreground mb-4">{post.content}</p>

                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <button className="flex items-center space-x-1 hover:text-red-500">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-500">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-green-500">
                        <Share className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </NCard>
            ))}
          </NInfiniteScroll>
        </div>
      </div>

      {/* Product Catalog */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Product Catalog</h2>
        <p className="text-muted-foreground mb-4">E-commerce style infinite scroll for product listings.</p>

        <div className="max-w-4xl mx-auto border rounded-lg max-h-96 overflow-hidden">
          <NInfiniteScroll
            next={fetchProducts}
            hasMore={products.length < 30}
            loader={
              <div className="text-center py-6">
                <NLoading />
                <p className="text-sm text-muted-foreground mt-2">Loading more products...</p>
              </div>
            }
            dataLength={products.length}
            scrollThreshold={0.8}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {products.map(product => (
                <NCard key={product.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>

                  <div>
                    <NBadge className="bg-purple-100 text-purple-800 text-xs mb-2">{product.category}</NBadge>

                    <h3 className="font-semibold mb-2">{product.name}</h3>

                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">({product.rating})</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">${product.price}</span>
                      <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">Add to Cart</button>
                    </div>
                  </div>
                </NCard>
              ))}
            </div>
          </NInfiniteScroll>
        </div>
      </div>

      {/* Notifications List */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Notifications List</h2>
        <p className="text-muted-foreground mb-4">Infinite scroll for notifications with different types and states.</p>

        <div className="max-w-lg mx-auto border rounded-lg max-h-80 overflow-hidden">
          <NInfiniteScroll
            next={fetchNotifications}
            hasMore={notifications.length < 25}
            loader={
              <div className="text-center py-4">
                <NLoading size="sm" />
                <p className="text-xs text-muted-foreground mt-1">Loading notifications...</p>
              </div>
            }
            dataLength={notifications.length}
            scrollThreshold={0.9}>
            {notifications.map(notification => (
              <div key={notification.id} className={`p-4 border-b border-gray-200 dark:border-gray-700 ${!notification.read ? 'bg-card' : ''}`}>
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'success'
                        ? 'bg-green-500'
                        : notification.type === 'warning'
                          ? 'bg-yellow-500'
                          : notification.type === 'error'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                    }`}
                  />

                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notification.timestamp}
                      </span>
                      <NBadge className={`text-xs ${getNotificationColor(notification.type)}`}>{notification.type}</NBadge>
                    </div>
                  </div>

                  {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                </div>
              </div>
            ))}
          </NInfiniteScroll>
        </div>
      </div>

      {/* Custom Loading States */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Loading States</h2>
        <p className="text-muted-foreground mb-4">Infinite scroll with custom loading animations and states.</p>

        <div className="max-w-md mx-auto border rounded-lg p-4 max-h-96 overflow-hidden">
          <NInfiniteScroll
            next={fetchCustomItems}
            hasMore={customItems.length < 40}
            loader={
              <div className="text-center py-6">
                <div className="flex justify-center space-x-1 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-sm text-muted-foreground">Loading awesome content...</p>
                <div className="mt-2 w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            }
            dataLength={customItems.length}
            scrollThreshold={0.85}>
            {customItems.map((item, index) => (
              <NCard
                key={index}
                className="p-4 mb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Custom Item {item}</h3>
                    <p className="text-sm text-muted-foreground">Enhanced content with custom styling</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <NBadge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">#{item}</NBadge>
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
              </NCard>
            ))}
          </NInfiniteScroll>

          <div className="mt-4 p-3 bg-card rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Items Loaded:</span>
                <div className="text-lg font-bold text-blue-600">{customItems.length}</div>
              </div>
              <div>
                <span className="font-medium">Progress:</span>
                <div className="text-lg font-bold text-purple-600">{Math.round((customItems.length / 40) * 100)}%</div>
              </div>
            </div>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${(customItems.length / 40) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Infinite Scroll Summary</h2>
        <p className="text-muted-foreground mb-4">Overview of all infinite scroll implementations and their current states.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NCard className="p-4 text-center">
            <h3 className="font-semibold mb-2">Basic Items</h3>
            <div className="text-2xl font-bold text-blue-600 mb-1">{basicItems.length}</div>
            <p className="text-sm text-muted-foreground">Simple items loaded</p>
            <div className="mt-2">
              <NBadge className={basicFetching ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                {basicFetching ? 'Loading...' : 'Ready'}
              </NBadge>
            </div>
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-semibold mb-2">Social Posts</h3>
            <div className="text-2xl font-bold text-purple-600 mb-1">{posts.length}</div>
            <p className="text-sm text-muted-foreground">Posts in feed</p>
            <div className="mt-2">
              <NBadge className={postsFetching ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                {postsFetching ? 'Loading...' : 'Ready'}
              </NBadge>
            </div>
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-semibold mb-2">Products</h3>
            <div className="text-2xl font-bold text-green-600 mb-1">{products.length}</div>
            <p className="text-sm text-muted-foreground">Products listed</p>
            <div className="mt-2">
              <NBadge className={productsFetching ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                {productsFetching ? 'Loading...' : 'Ready'}
              </NBadge>
            </div>
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-semibold mb-2">Notifications</h3>
            <div className="text-2xl font-bold text-red-600 mb-1">{notifications.length}</div>
            <p className="text-sm text-muted-foreground">Notifications shown</p>
            <div className="mt-2">
              <NBadge className={notificationsFetching ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                {notificationsFetching ? 'Loading...' : 'Ready'}
              </NBadge>
            </div>
          </NCard>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default InfiniteScroll;
