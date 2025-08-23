import { useEffect, useState } from 'react';
import { NButton, NCard, NProgress } from '@nayan-ui/react';
import {
  AlertCircle,
  Battery,
  CheckCircle,
  Clock,
  Cpu,
  Download,
  HardDrive,
  Heart,
  MemoryStick,
  Pause,
  Play,
  RotateCcw,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  Wifi,
  Zap
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Progress = () => {
  const [basicProgress, setBasicProgress] = useState(50);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [systemStats, setSystemStats] = useState({
    cpu: 45,
    memory: 68,
    disk: 82,
    battery: 75,
    network: 92
  });

  const simulateDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + Math.random() * 12;
      });
    }, 250);
  };

  const startAnimation = () => {
    setIsAnimating(true);
    setAnimatedProgress(0);
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnimating(false);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const resetProgress = () => {
    setBasicProgress(50);
    setDownloadProgress(0);
    setUploadProgress(0);
    setAnimatedProgress(0);
    setIsDownloading(false);
    setIsUploading(false);
    setIsAnimating(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 20)),
        memory: Math.max(20, Math.min(95, prev.memory + (Math.random() - 0.5) * 15)),
        disk: Math.max(50, Math.min(100, prev.disk + (Math.random() - 0.5) * 5)),
        battery: Math.max(5, Math.min(100, prev.battery + (Math.random() - 0.5) * 10)),
        network: Math.max(30, Math.min(100, prev.network + (Math.random() - 0.5) * 25))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ComponentWrapper>
      {/* Basic Progress */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Progress</h2>
        <p className="text-muted-foreground mb-4">Simple progress bars with different values and labels.</p>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Progress with Labels</h3>
            <div className="space-y-4">
              <NProgress value={25} label="Getting Started" showLabel={true} />
              <NProgress value={50} label="In Progress" showLabel={true} />
              <NProgress value={75} label="Almost Done" showLabel={true} />
              <NProgress value={100} label="Completed" showLabel={true} />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Progress without Labels</h3>
            <div className="space-y-4">
              <NProgress value={20} />
              <NProgress value={45} />
              <NProgress value={70} />
              <NProgress value={95} />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Interactive Progress</h3>
            <div className="space-y-4">
              <NProgress value={basicProgress} label={`${Math.round(basicProgress)}% Complete`} showLabel={true} />
              <div className="flex space-x-2">
                <NButton onClick={() => setBasicProgress(Math.max(0, basicProgress - 10))}>-10%</NButton>
                <NButton onClick={() => setBasicProgress(Math.min(100, basicProgress + 10))}>+10%</NButton>
                <NButton onClick={() => setBasicProgress(50)} isOutline>
                  Reset
                </NButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Operations Progress */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">File Operations Progress</h2>
        <p className="text-muted-foreground mb-4">Progress bars for download and upload operations.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-4 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download Progress</span>
            </h3>

            <div className="space-y-4">
              <NProgress
                value={downloadProgress}
                label={
                  isDownloading
                    ? `Downloading... ${Math.round(downloadProgress)}%`
                    : downloadProgress === 100
                      ? 'Download Complete!'
                      : 'Ready to Download'
                }
                showLabel={true}
              />

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{isDownloading ? 'Downloading file...' : downloadProgress === 100 ? 'Download finished' : 'Click to start download'}</span>
                {isDownloading && <span>{Math.round(downloadProgress)}%</span>}
              </div>

              <NButton onClick={simulateDownload} disabled={isDownloading} className="w-full flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Downloading...' : 'Start Download'}</span>
              </NButton>
            </div>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-4 flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload Progress</span>
            </h3>

            <div className="space-y-4">
              <NProgress
                value={uploadProgress}
                label={isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : uploadProgress === 100 ? 'Upload Complete!' : 'Ready to Upload'}
                showLabel={true}
              />

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{isUploading ? 'Uploading file...' : uploadProgress === 100 ? 'Upload finished' : 'Click to start upload'}</span>
                {isUploading && <span>{Math.round(uploadProgress)}%</span>}
              </div>

              <NButton onClick={simulateUpload} disabled={isUploading} className="w-full flex items-center justify-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading...' : 'Start Upload'}</span>
              </NButton>
            </div>
          </NCard>
        </div>
      </div>

      {/* Animated Progress */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Animated Progress</h2>
        <p className="text-muted-foreground mb-4">Progress bars with smooth animations and transitions.</p>

        <div className="space-y-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-4">Smooth Animation</h3>
            <div className="space-y-4">
              <NProgress value={animatedProgress} label={`Processing... ${Math.round(animatedProgress)}%`} showLabel={true} />

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {isAnimating ? 'Animation in progress...' : animatedProgress === 100 ? 'Animation complete!' : 'Click to start animation'}
                </div>
                <div className="flex space-x-2">
                  <NButton onClick={startAnimation} disabled={isAnimating} className="flex items-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Start</span>
                  </NButton>
                  <NButton onClick={() => setAnimatedProgress(0)} isOutline className="flex items-center space-x-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </NButton>
                </div>
              </div>
            </div>
          </NCard>
        </div>
      </div>

      {/* System Status Progress */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">System Status Progress</h2>
        <p className="text-muted-foreground mb-4">Progress bars showing system resource usage and status.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NCard className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span className="font-medium">CPU Usage</span>
            </div>
            <NProgress value={systemStats.cpu} label={`${Math.round(systemStats.cpu)}%`} showLabel={true} />
            <div className="text-xs text-muted-foreground mt-1">{systemStats.cpu < 50 ? 'Normal' : systemStats.cpu < 80 ? 'High' : 'Critical'}</div>
          </NCard>

          <NCard className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <MemoryStick className="w-4 h-4 text-green-500" />
              <span className="font-medium">Memory</span>
            </div>
            <NProgress value={systemStats.memory} label={`${Math.round(systemStats.memory)}%`} showLabel={true} />
            <div className="text-xs text-muted-foreground mt-1">
              {systemStats.memory < 60 ? 'Available' : systemStats.memory < 85 ? 'Moderate' : 'High Usage'}
            </div>
          </NCard>

          <NCard className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <HardDrive className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Disk Space</span>
            </div>
            <NProgress value={systemStats.disk} label={`${Math.round(systemStats.disk)}%`} showLabel={true} />
            <div className="text-xs text-muted-foreground mt-1">
              {systemStats.disk < 70 ? 'Plenty of space' : systemStats.disk < 90 ? 'Getting full' : 'Almost full'}
            </div>
          </NCard>

          <NCard className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Battery className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Battery</span>
            </div>
            <NProgress value={systemStats.battery} label={`${Math.round(systemStats.battery)}%`} showLabel={true} />
            <div className="text-xs text-muted-foreground mt-1">
              {systemStats.battery > 50 ? 'Good' : systemStats.battery > 20 ? 'Low' : 'Critical'}
            </div>
          </NCard>

          <NCard className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Wifi className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">Network</span>
            </div>
            <NProgress value={systemStats.network} label={`${Math.round(systemStats.network)}%`} showLabel={true} />
            <div className="text-xs text-muted-foreground mt-1">
              {systemStats.network > 80 ? 'Excellent' : systemStats.network > 50 ? 'Good' : 'Poor'}
            </div>
          </NCard>

          <NCard className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Performance</span>
            </div>
            <NProgress
              value={(systemStats.cpu + systemStats.memory + systemStats.network) / 3}
              label={`${Math.round((systemStats.cpu + systemStats.memory + systemStats.network) / 3)}%`}
              showLabel={true}
            />
            <div className="text-xs text-muted-foreground mt-1">Overall system performance</div>
          </NCard>
        </div>
      </div>

      {/* Progress with Status */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Progress with Status</h2>
        <p className="text-muted-foreground mb-4">Progress bars with status indicators and contextual information.</p>

        <div className="space-y-4">
          <NCard className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">Project Setup</span>
              </div>
              <span className="text-sm text-green-600">Complete</span>
            </div>
            <NProgress value={100} label="Setup Complete" showLabel={true} />
          </NCard>

          <NCard className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Development</span>
              </div>
              <span className="text-sm text-blue-600">In Progress</span>
            </div>
            <NProgress value={65} label="65% Complete" showLabel={true} />
          </NCard>

          <NCard className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">Testing</span>
              </div>
              <span className="text-sm text-yellow-600">Pending</span>
            </div>
            <NProgress value={0} label="Not Started" showLabel={true} />
          </NCard>

          <NCard className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Deployment</span>
              </div>
              <span className="text-sm text-gray-500">Scheduled</span>
            </div>
            <NProgress value={0} label="Awaiting Development" showLabel={true} />
          </NCard>
        </div>
      </div>

      {/* Skills/Rating Progress */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Skills & Ratings Progress</h2>
        <p className="text-muted-foreground mb-4">Progress bars representing skills, ratings, and achievements.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-4">Technical Skills</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">React</span>
                  <span className="text-sm text-muted-foreground">Expert</span>
                </div>
                <NProgress value={90} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">TypeScript</span>
                  <span className="text-sm text-muted-foreground">Advanced</span>
                </div>
                <NProgress value={80} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Node.js</span>
                  <span className="text-sm text-muted-foreground">Intermediate</span>
                </div>
                <NProgress value={65} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Python</span>
                  <span className="text-sm text-muted-foreground">Beginner</span>
                </div>
                <NProgress value={35} />
              </div>
            </div>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-4">Achievement Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">5-Star Reviews</span>
                  </div>
                  <span className="text-sm text-muted-foreground">47/50</span>
                </div>
                <NProgress value={94} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Customer Satisfaction</span>
                  </div>
                  <span className="text-sm text-muted-foreground">88%</span>
                </div>
                <NProgress value={88} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-gold-500" />
                    <span className="text-sm">Project Completion</span>
                  </div>
                  <span className="text-sm text-muted-foreground">23/25</span>
                </div>
                <NProgress value={92} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Growth Target</span>
                  </div>
                  <span className="text-sm text-muted-foreground">72%</span>
                </div>
                <NProgress value={72} />
              </div>
            </div>
          </NCard>
        </div>
      </div>

      {/* Progress Best Practices */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Progress Best Practices</h2>
        <p className="text-muted-foreground mb-4">Guidelines for effective progress bar implementation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">✅ Do</h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>• Show progress for operations taking 2 seconds</li>
              <li>• Use descriptive labels for context</li>
              <li>• Provide percentage or time estimates</li>
              <li>• Use appropriate colors for different states</li>
              <li>• Make progress bars accessible</li>
              <li>• Show completion status clearly</li>
              <li>• Use smooth animations for better UX</li>
            </ul>
          </NCard>

          <NCard className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-3">❌ Don't</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
              <li>• Use progress bars for instant operations</li>
              <li>• Make progress bars too small to see</li>
              <li>• Use misleading progress indicators</li>
              <li>• Forget to handle error states</li>
              <li>• Use progress bars without context</li>
              <li>• Make progress bars jump backwards</li>
              <li>• Ignore accessibility requirements</li>
            </ul>
          </NCard>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Progress Summary</h2>
        <p className="text-muted-foreground mb-4">Current status of all progress examples.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-2">Basic Progress</h3>
            <div className="text-2xl font-bold text-blue-600 mb-1">{Math.round(basicProgress)}%</div>
            <p className="text-sm text-muted-foreground">Interactive demo</p>
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-2">Download</h3>
            <div className="text-2xl font-bold text-green-600 mb-1">{Math.round(downloadProgress)}%</div>
            <p className="text-sm text-muted-foreground">{isDownloading ? 'In progress' : downloadProgress === 100 ? 'Complete' : 'Ready'}</p>
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-2">Upload</h3>
            <div className="text-2xl font-bold text-purple-600 mb-1">{Math.round(uploadProgress)}%</div>
            <p className="text-sm text-muted-foreground">{isUploading ? 'In progress' : uploadProgress === 100 ? 'Complete' : 'Ready'}</p>
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-2">Animation</h3>
            <div className="text-2xl font-bold text-orange-600 mb-1">{Math.round(animatedProgress)}%</div>
            <p className="text-sm text-muted-foreground">{isAnimating ? 'Animating' : animatedProgress === 100 ? 'Complete' : 'Ready'}</p>
          </NCard>
        </div>

        <div className="mt-4 text-center">
          <NButton onClick={resetProgress} isOutline className="flex items-center space-x-2 mx-auto">
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Progress</span>
          </NButton>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Progress;
