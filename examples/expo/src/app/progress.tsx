import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NProgress, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  // Basic progress states
  const [basicProgress, setBasicProgress] = useState(25);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [installProgress, setInstallProgress] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // System monitoring
  const [systemStats, setSystemStats] = useState({
    cpu: 45,
    memory: 68,
    disk: 82,
    network: 23,
    battery: 76
  });

  // Skills and ratings
  const [skills, setSkills] = useState({
    javascript: 85,
    react: 78,
    nodejs: 65,
    python: 72,
    design: 60,
    testing: 55
  });

  // Project progress
  const [projectTasks, setProjectTasks] = useState({
    planning: 100,
    design: 85,
    development: 60,
    testing: 30,
    deployment: 0,
    documentation: 45
  });

  // Animated progress
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // File operations simulation
  const [fileOperations, setFileOperations] = useState({
    backup: 0,
    sync: 0,
    compression: 0,
    extraction: 0
  });

  // Health and fitness
  const [healthMetrics, setHealthMetrics] = useState({
    steps: 65, // 6500/10000 steps
    water: 40, // 4/10 glasses
    sleep: 87, // 7/8 hours
    calories: 55, // 1100/2000 calories
    exercise: 30 // 30/60 minutes
  });

  useEffect(() => {
    // Simulate system stats updates
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(95, prev.memory + (Math.random() - 0.5) * 5)),
        disk: prev.disk,
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 20)),
        battery: Math.max(0, Math.min(100, prev.battery - 0.1))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const simulateDownload = () => {
    setDownloadProgress(0);
    NToast.info('Download started...');

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          NToast.success('Download completed!');
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  const simulateUpload = () => {
    setUploadProgress(0);
    NToast.info('Upload started...');

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.random() * 12;
        if (newProgress >= 100) {
          clearInterval(interval);
          NToast.success('Upload completed!');
          return 100;
        }
        return newProgress;
      });
    }, 400);
  };

  const simulateInstallation = () => {
    setInstallProgress(0);
    NToast.info('Installation started...');

    const phases = [
      { name: 'Downloading packages...', duration: 2000, progress: 30 },
      { name: 'Installing dependencies...', duration: 3000, progress: 60 },
      { name: 'Configuring settings...', duration: 1500, progress: 85 },
      { name: 'Finalizing installation...', duration: 1000, progress: 100 }
    ];

    let currentPhase = 0;

    const runPhase = () => {
      if (currentPhase < phases.length) {
        const phase = phases[currentPhase];
        NToast.info(phase.name);

        setTimeout(() => {
          setInstallProgress(phase.progress);
          currentPhase++;
          if (currentPhase < phases.length) {
            runPhase();
          } else {
            NToast.success('Installation completed!');
          }
        }, phase.duration);
      }
    };

    runPhase();
  };

  const animateProgress = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnimatedProgress(0);
    NToast.info('Animation started...');

    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        const newProgress = prev + 2;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsAnimating(false);
          NToast.success('Animation completed!');
          return 100;
        }
        return newProgress;
      });
    }, 50);
  };

  const simulateFileOperation = (operation: string) => {
    setFileOperations(prev => ({ ...prev, [operation]: 0 }));
    NToast.info(`${operation} started...`);

    const interval = setInterval(() => {
      setFileOperations(prev => {
        const newProgress = prev[operation] + Math.random() * 8;
        if (newProgress >= 100) {
          clearInterval(interval);
          NToast.success(`${operation} completed!`);
          return { ...prev, [operation]: 100 };
        }
        return { ...prev, [operation]: newProgress };
      });
    }, 200);
  };

  const updateSkill = (skill: string, value: number) => {
    setSkills(prev => ({ ...prev, [skill]: value }));
    NToast.info(`${skill} skill updated to ${value}%`);
  };

  const updateProjectTask = (task: string, value: number) => {
    setProjectTasks(prev => ({ ...prev, [task]: value }));
    NToast.info(`${task} progress updated to ${value}%`);
  };

  const resetAllProgress = () => {
    setBasicProgress(25);
    setDownloadProgress(0);
    setUploadProgress(0);
    setInstallProgress(0);
    setLoadingProgress(0);
    setAnimatedProgress(0);
    setFileOperations({ backup: 0, sync: 0, compression: 0, extraction: 0 });
    NToast.success('All progress reset');
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    if (value >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressLabel = (value: number) => {
    if (value >= 90) return 'Excellent';
    if (value >= 70) return 'Good';
    if (value >= 50) return 'Average';
    if (value >= 30) return 'Below Average';
    return 'Poor';
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Progress */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Progress</NText>
      <NCard className="mb-6">
        <NProgress value={basicProgress} className="mb-3" />
        <NText className="text-sm text-muted mb-3">Progress: {Math.round(basicProgress)}%</NText>
        <View className="flex-row gap-2">
          <NButton className="flex-1 bg-blue-500 border-blue-500" onPress={() => setBasicProgress(Math.min(100, basicProgress + 10))}>
            +10%
          </NButton>
          <NButton className="flex-1 bg-red-500 border-red-500" onPress={() => setBasicProgress(Math.max(0, basicProgress - 10))}>
            -10%
          </NButton>
        </View>
      </NCard>

      {/* File Operations */}
      <NText className="text-xl font-bold mb-3 text-text">File Operations</NText>
      <NCard className="mb-6">
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <NText className="text-text font-medium">Download</NText>
            <NText className="text-sm text-muted">{Math.round(downloadProgress)}%</NText>
          </View>
          <NProgress value={downloadProgress} indicatorClassName="bg-blue-500" />
          <NButton className="mt-2 bg-blue-500 border-blue-500" onPress={simulateDownload}>
            Start Download
          </NButton>
        </View>

        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <NText className="text-text font-medium">Upload</NText>
            <NText className="text-sm text-muted">{Math.round(uploadProgress)}%</NText>
          </View>
          <NProgress value={uploadProgress} indicatorClassName="bg-green-500" />
          <NButton className="mt-2 bg-green-500 border-green-500" onPress={simulateUpload}>
            Start Upload
          </NButton>
        </View>

        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <NText className="text-text font-medium">Installation</NText>
            <NText className="text-sm text-muted">{Math.round(installProgress)}%</NText>
          </View>
          <NProgress value={installProgress} indicatorClassName="bg-purple-500" />
          <NButton className="mt-2 bg-purple-500 border-purple-500" onPress={simulateInstallation}>
            Start Installation
          </NButton>
        </View>
      </NCard>

      {/* System Monitoring */}
      <NText className="text-xl font-bold mb-3 text-text">System Monitoring</NText>
      <NCard className="mb-6">
        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-1">
            <NText className="text-text font-medium">CPU Usage</NText>
            <NText className="text-sm text-muted">{Math.round(systemStats.cpu)}%</NText>
          </View>
          <NProgress
            value={systemStats.cpu}
            indicatorClassName={systemStats.cpu > 80 ? 'bg-red-500' : systemStats.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}
          />
        </View>

        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-1">
            <NText className="text-text font-medium">Memory Usage</NText>
            <NText className="text-sm text-muted">{Math.round(systemStats.memory)}%</NText>
          </View>
          <NProgress
            value={systemStats.memory}
            indicatorClassName={systemStats.memory > 85 ? 'bg-red-500' : systemStats.memory > 70 ? 'bg-yellow-500' : 'bg-blue-500'}
          />
        </View>

        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-1">
            <NText className="text-text font-medium">Disk Usage</NText>
            <NText className="text-sm text-muted">{Math.round(systemStats.disk)}%</NText>
          </View>
          <NProgress
            value={systemStats.disk}
            indicatorClassName={systemStats.disk > 90 ? 'bg-red-500' : systemStats.disk > 75 ? 'bg-orange-500' : 'bg-green-500'}
          />
        </View>

        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-1">
            <NText className="text-text font-medium">Network Activity</NText>
            <NText className="text-sm text-muted">{Math.round(systemStats.network)}%</NText>
          </View>
          <NProgress value={systemStats.network} indicatorClassName="bg-cyan-500" />
        </View>

        <View>
          <View className="flex-row justify-between items-center mb-1">
            <NText className="text-text font-medium">Battery Level</NText>
            <NText className="text-sm text-muted">{Math.round(systemStats.battery)}%</NText>
          </View>
          <NProgress
            value={systemStats.battery}
            indicatorClassName={systemStats.battery < 20 ? 'bg-red-500' : systemStats.battery < 50 ? 'bg-yellow-500' : 'bg-green-500'}
          />
        </View>
      </NCard>

      {/* Skills & Ratings */}
      <NText className="text-xl font-bold mb-3 text-text">Skills & Expertise</NText>
      <NCard className="mb-6">
        {Object.entries(skills).map(([skill, value]) => (
          <View key={skill} className="mb-3">
            <View className="flex-row justify-between items-center mb-1">
              <NText className="text-text font-medium capitalize">{skill}</NText>
              <NText className="text-sm text-muted">
                {value}% - {getProgressLabel(value)}
              </NText>
            </View>
            <NProgress value={value} indicatorClassName={getProgressColor(value)} />
            <View className="flex-row gap-1 mt-1">
              <NButton className="flex-1 px-2 py-1 bg-green-500 border-green-500" onPress={() => updateSkill(skill, Math.min(100, value + 5))}>
                +5
              </NButton>
              <NButton className="flex-1 px-2 py-1 bg-red-500 border-red-500" onPress={() => updateSkill(skill, Math.max(0, value - 5))}>
                -5
              </NButton>
            </View>
          </View>
        ))}
      </NCard>

      {/* Project Progress */}
      <NText className="text-xl font-bold mb-3 text-text">Project Progress</NText>
      <NCard className="mb-6">
        {Object.entries(projectTasks).map(([task, value]) => (
          <View key={task} className="mb-3">
            <View className="flex-row justify-between items-center mb-1">
              <NText className="text-text font-medium capitalize">{task}</NText>
              <NText className="text-sm text-muted">{value}%</NText>
            </View>
            <NProgress value={value} indicatorClassName={value === 100 ? 'bg-green-500' : value >= 50 ? 'bg-blue-500' : 'bg-gray-400'} />
            <View className="flex-row gap-1 mt-1">
              <NButton className="flex-1 px-2 py-1 bg-blue-500 border-blue-500" onPress={() => updateProjectTask(task, Math.min(100, value + 10))}>
                +10%
              </NButton>
              <NButton className="flex-1 px-2 py-1 bg-gray-500 border-gray-500" onPress={() => updateProjectTask(task, Math.max(0, value - 10))}>
                -10%
              </NButton>
            </View>
          </View>
        ))}

        <View className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <NText className="text-blue-800 font-semibold">
            Overall Progress: {Math.round(Object.values(projectTasks).reduce((a, b) => a + b, 0) / Object.values(projectTasks).length)}%
          </NText>
        </View>
      </NCard>

      {/* Health & Fitness */}
      <NText className="text-xl font-bold mb-3 text-text">Health & Fitness</NText>
      <NCard className="mb-6">
        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-1">
            <NText className="text-text font-medium">🚶 Daily Steps</NText>
            <NText className="text-sm text-muted">6,500 / 10,000</NText>
          </View>
          <NProgress value={healthMetrics.steps} indicatorClassName="bg-green-500" />
        </View>

        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-1">
            <NText className="text-text font-medium">💧 Water Intake</NText>
            <NText className="text-sm text-muted">4 / 10 glasses</NText>
          </View>
          <NProgress value={healthMetrics.water} indicatorClassName="bg-blue-500" />
        </View>

        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-1">
            <NText className="text-text font-medium">😴 Sleep Quality</NText>
            <NText className="text-sm text-muted">7 / 8 hours</NText>
          </View>
          <NProgress value={healthMetrics.sleep} indicatorClassName="bg-purple-500" />
        </View>

        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-1">
            <NText className="text-text font-medium">🔥 Calories Burned</NText>
            <NText className="text-sm text-muted">1,100 / 2,000</NText>
          </View>
          <NProgress value={healthMetrics.calories} indicatorClassName="bg-orange-500" />
        </View>

        <View>
          <View className="flex-row justify-between items-center mb-1">
            <NText className="text-text font-medium">💪 Exercise Time</NText>
            <NText className="text-sm text-muted">30 / 60 minutes</NText>
          </View>
          <NProgress value={healthMetrics.exercise} indicatorClassName="bg-red-500" />
        </View>
      </NCard>

      {/* Animated Progress */}
      <NText className="text-xl font-bold mb-3 text-text">Animated Progress</NText>
      <NCard className="mb-6">
        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-2">
            <NText className="text-text font-medium">Smooth Animation</NText>
            <NText className="text-sm text-muted">{Math.round(animatedProgress)}%</NText>
          </View>
          <NProgress value={animatedProgress} indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500" />
        </View>
        <NButton className="bg-purple-500 border-purple-500" onPress={animateProgress} disabled={isAnimating}>
          {isAnimating ? 'Animating...' : 'Start Animation'}
        </NButton>
      </NCard>

      {/* File Operations Progress */}
      <NText className="text-xl font-bold mb-3 text-text">Advanced File Operations</NText>
      <NCard className="mb-6">
        {Object.entries(fileOperations).map(([operation, progress]) => (
          <View key={operation} className="mb-3">
            <View className="flex-row justify-between items-center mb-1">
              <NText className="text-text font-medium capitalize">{operation}</NText>
              <NText className="text-sm text-muted">{Math.round(progress)}%</NText>
            </View>
            <NProgress value={progress} indicatorClassName="bg-indigo-500" />
            <NButton className="mt-1 bg-indigo-500 border-indigo-500" onPress={() => simulateFileOperation(operation)}>
              Start {operation}
            </NButton>
          </View>
        ))}
      </NCard>

      {/* Custom Styled Progress */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled Progress</NText>
      <NCard className="mb-6">
        <View className="mb-4">
          <NText className="text-text font-medium mb-2">Large Progress Bar</NText>
          <NProgress value={75} className="h-6 rounded-full" indicatorClassName="bg-gradient-to-r from-green-400 to-blue-500 rounded-full" />
        </View>

        <View className="mb-4">
          <NText className="text-text font-medium mb-2">Thin Progress Bar</NText>
          <NProgress value={60} className="h-1" indicatorClassName="bg-red-500" />
        </View>

        <View className="mb-4">
          <NText className="text-text font-medium mb-2">Rounded Progress Bar</NText>
          <NProgress value={85} className="h-4 rounded-full bg-gray-200" indicatorClassName="bg-yellow-500 rounded-full" />
        </View>

        <View>
          <NText className="text-text font-medium mb-2">Multi-color Progress</NText>
          <NProgress
            value={90}
            className="h-5 rounded-lg"
            indicatorClassName="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-lg"
          />
        </View>
      </NCard>

      {/* Action Buttons */}
      <View className="flex-row gap-2 mt-4">
        <NButton className="flex-1 bg-red-500 border-red-500" onPress={resetAllProgress}>
          Reset All
        </NButton>
        <NButton
          className="flex-1 bg-green-500 border-green-500"
          onPress={() => {
            const allProgress = {
              basic: basicProgress,
              files: { downloadProgress, uploadProgress, installProgress },
              system: systemStats,
              skills,
              project: projectTasks,
              health: healthMetrics,
              fileOps: fileOperations
            };
            console.log('All progress data:', allProgress);
            NToast.success('Progress data saved!');
          }}>
          Save Progress
        </NButton>
      </View>

      {/* Progress Summary */}
      <NCard className="mt-6">
        <NText className="text-lg font-bold text-text mb-3">Progress Summary</NText>
        <View className="space-y-2">
          <NText className="text-sm text-muted">
            Average Skill Level: {Math.round(Object.values(skills).reduce((a, b) => a + b, 0) / Object.values(skills).length)}%
          </NText>
          <NText className="text-sm text-muted">
            Project Completion: {Math.round(Object.values(projectTasks).reduce((a, b) => a + b, 0) / Object.values(projectTasks).length)}%
          </NText>
          <NText className="text-sm text-muted">
            Health Score: {Math.round(Object.values(healthMetrics).reduce((a, b) => a + b, 0) / Object.values(healthMetrics).length)}%
          </NText>
          <NText className="text-sm text-muted">
            System Performance: {Math.round((systemStats.cpu + systemStats.memory + systemStats.network) / 3)}%
          </NText>
          <NText className="text-sm text-muted">
            File Operations: {Math.round(Object.values(fileOperations).reduce((a, b) => a + b, 0) / Object.values(fileOperations).length)}%
          </NText>
        </View>
      </NCard>

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2">💡 Progress Bar Best Practices</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Use appropriate colors to indicate status (green=good, red=critical){'\n'}• Provide clear labels and percentage values{'\n'}• Consider
          animation for better user experience{'\n'}• Use different heights for visual hierarchy{'\n'}• Group related progress bars together{'\n'}•
          Provide context with descriptive text{'\n'}• Update progress in real-time when possible{'\n'}• Test accessibility with screen readers
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
