import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NMenu, NMenuItem, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  // Menu interaction tracking
  const [menuActions, setMenuActions] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    status: 'online',
    notifications: true,
    darkMode: false
  });

  // File operations state
  const [selectedFile, setSelectedFile] = useState('document.pdf');
  const [fileActions, setFileActions] = useState<string[]>([]);

  // Project management state
  const [projectStatus, setProjectStatus] = useState('in-progress');
  const [projectActions, setProjectActions] = useState<string[]>([]);

  const addMenuAction = (action: string) => {
    setMenuActions(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${action}`]);
    NToast.info(action);
  };

  const addFileAction = (action: string) => {
    setFileActions(prev => [...prev.slice(-4), action]);
    addMenuAction(`File: ${action}`);
  };

  const addProjectAction = (action: string) => {
    setProjectActions(prev => [...prev.slice(-4), action]);
    addMenuAction(`Project: ${action}`);
  };

  const handleUserAction = (action: string) => {
    switch (action) {
      case 'Edit Profile':
        addMenuAction('Profile editing opened');
        break;
      case 'Settings':
        addMenuAction('Settings panel opened');
        break;
      case 'Toggle Notifications':
        setUserProfile(prev => ({ ...prev, notifications: !prev.notifications }));
        addMenuAction(`Notifications ${userProfile.notifications ? 'disabled' : 'enabled'}`);
        break;
      case 'Toggle Dark Mode':
        setUserProfile(prev => ({ ...prev, darkMode: !prev.darkMode }));
        addMenuAction(`Dark mode ${userProfile.darkMode ? 'disabled' : 'enabled'}`);
        break;
      case 'Sign Out':
        addMenuAction('User signed out');
        break;
      default:
        addMenuAction(action);
    }
  };

  const handleFileAction = (action: string) => {
    switch (action) {
      case 'Open':
        addFileAction(`Opened ${selectedFile}`);
        break;
      case 'Download':
        addFileAction(`Downloaded ${selectedFile}`);
        break;
      case 'Share':
        addFileAction(`Shared ${selectedFile}`);
        break;
      case 'Rename':
        addFileAction(`Renamed ${selectedFile}`);
        break;
      case 'Delete':
        addFileAction(`Deleted ${selectedFile}`);
        break;
      case 'Properties':
        addFileAction(`Viewed properties of ${selectedFile}`);
        break;
      default:
        addFileAction(action);
    }
  };

  const handleProjectAction = (action: string) => {
    switch (action) {
      case 'Mark Complete':
        setProjectStatus('completed');
        addProjectAction('Project marked as complete');
        break;
      case 'Mark In Progress':
        setProjectStatus('in-progress');
        addProjectAction('Project marked as in progress');
        break;
      case 'Archive':
        setProjectStatus('archived');
        addProjectAction('Project archived');
        break;
      case 'Duplicate':
        addProjectAction('Project duplicated');
        break;
      case 'Export':
        addProjectAction('Project exported');
        break;
      case 'Delete':
        addProjectAction('Project deleted');
        break;
      default:
        addProjectAction(action);
    }
  };

  const clearAllActions = () => {
    setMenuActions([]);
    setFileActions([]);
    setProjectActions([]);
    NToast.success('All actions cleared');
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Menu */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Menu</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-3 flex-wrap">
          <NMenu trigger={<NButton className="bg-blue-500 border-blue-500">Basic Menu</NButton>} title="Actions">
            <NMenuItem title="New Item" onPress={() => addMenuAction('New item created')} />
            <NMenuItem title="Edit" onPress={() => addMenuAction('Edit action triggered')} />
            <NMenuItem title="Delete" onPress={() => addMenuAction('Delete action triggered')} hasSeparator />
            <NMenuItem title="Settings" onPress={() => addMenuAction('Settings opened')} />
          </NMenu>

          <NMenu trigger={<NButton className="bg-green-500 border-green-500">With Shortcuts</NButton>} title="Quick Actions">
            <NMenuItem title="Copy" shortcut="⌘C" onPress={() => addMenuAction('Copy action')} />
            <NMenuItem title="Paste" shortcut="⌘V" onPress={() => addMenuAction('Paste action')} />
            <NMenuItem title="Cut" shortcut="⌘X" onPress={() => addMenuAction('Cut action')} hasSeparator />
            <NMenuItem title="Select All" shortcut="⌘A" onPress={() => addMenuAction('Select all')} />
          </NMenu>
        </View>
      </NCard>

      {/* User Profile Menu */}
      <NText className="text-xl font-bold mb-3 text-text">User Profile Menu</NText>
      <NCard className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <NText className="text-text font-semibold">{userProfile.name}</NText>
            <NText className="text-sm text-muted capitalize">Status: {userProfile.status}</NText>
          </View>
          <NMenu trigger={<NButton className="bg-purple-500 border-purple-500">Profile Menu</NButton>} title="Profile Options">
            <NMenuItem title="Edit Profile" onPress={() => handleUserAction('Edit Profile')} />
            <NMenuItem title="View Activity" onPress={() => handleUserAction('View Activity')} />
            <NMenuItem title="Privacy Settings" onPress={() => handleUserAction('Privacy Settings')} hasSeparator />
            <NMenuItem
              title={`${userProfile.notifications ? 'Disable' : 'Enable'} Notifications`}
              onPress={() => handleUserAction('Toggle Notifications')}
            />
            <NMenuItem title={`${userProfile.darkMode ? 'Light' : 'Dark'} Mode`} onPress={() => handleUserAction('Toggle Dark Mode')} hasSeparator />
            <NMenuItem title="Help & Support" onPress={() => handleUserAction('Help & Support')} />
            <NMenuItem title="Sign Out" onPress={() => handleUserAction('Sign Out')} textClassName="text-red-600" />
          </NMenu>
        </View>
        <View className="p-3 bg-gray-50 rounded-lg">
          <NText className="text-sm text-muted">
            Notifications: {userProfile.notifications ? 'Enabled' : 'Disabled'} | Theme: {userProfile.darkMode ? 'Dark' : 'Light'}
          </NText>
        </View>
      </NCard>

      {/* File Context Menu */}
      <NText className="text-xl font-bold mb-3 text-text">File Context Menu</NText>
      <NCard className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <NText className="text-red-600 font-bold">PDF</NText>
            </View>
            <View>
              <NText className="text-text font-medium">{selectedFile}</NText>
              <NText className="text-sm text-muted">2.4 MB • Modified today</NText>
            </View>
          </View>
          <NMenu trigger={<NButton className="bg-gray-500 border-gray-500">File Actions</NButton>} title="File Operations">
            <NMenuItem title="Open" shortcut="⌘O" onPress={() => handleFileAction('Open')} />
            <NMenuItem title="Open With..." onPress={() => handleFileAction('Open With')} hasSeparator />
            <NMenuItem title="Download" shortcut="⌘D" onPress={() => handleFileAction('Download')} />
            <NMenuItem title="Share" onPress={() => handleFileAction('Share')} />
            <NMenuItem title="Copy Link" onPress={() => handleFileAction('Copy Link')} hasSeparator />
            <NMenuItem title="Rename" shortcut="F2" onPress={() => handleFileAction('Rename')} />
            <NMenuItem title="Move to Folder" onPress={() => handleFileAction('Move to Folder')} />
            <NMenuItem title="Properties" shortcut="⌘I" onPress={() => handleFileAction('Properties')} hasSeparator />
            <NMenuItem title="Delete" shortcut="Del" onPress={() => handleFileAction('Delete')} textClassName="text-red-600" />
          </NMenu>
        </View>
        {fileActions.length > 0 && (
          <View className="p-3 bg-blue-50 rounded-lg">
            <NText className="text-blue-800 font-semibold mb-1">Recent File Actions:</NText>
            {fileActions.map((action, index) => (
              <NText key={index} className="text-blue-700 text-sm">
                • {action}
              </NText>
            ))}
          </View>
        )}
      </NCard>

      {/* Project Management Menu */}
      <NText className="text-xl font-bold mb-3 text-text">Project Management</NText>
      <NCard className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <NText className="text-text font-semibold">Mobile App Project</NText>
            <NText className="text-sm text-muted capitalize">Status: {projectStatus.replace('-', ' ')}</NText>
          </View>
          <NMenu trigger={<NButton className="bg-indigo-500 border-indigo-500">Project Menu</NButton>} title="Project Actions">
            <NMenuItem title="View Details" onPress={() => handleProjectAction('View Details')} />
            <NMenuItem title="Edit Project" onPress={() => handleProjectAction('Edit Project')} />
            <NMenuItem title="Manage Team" onPress={() => handleProjectAction('Manage Team')} hasSeparator />
            <NMenuItem title="Mark Complete" onPress={() => handleProjectAction('Mark Complete')} />
            <NMenuItem title="Mark In Progress" onPress={() => handleProjectAction('Mark In Progress')} />
            <NMenuItem title="Archive" onPress={() => handleProjectAction('Archive')} hasSeparator />
            <NMenuItem title="Duplicate" onPress={() => handleProjectAction('Duplicate')} />
            <NMenuItem title="Export" onPress={() => handleProjectAction('Export')} />
            <NMenuItem title="Generate Report" onPress={() => handleProjectAction('Generate Report')} hasSeparator />
            <NMenuItem title="Delete Project" onPress={() => handleProjectAction('Delete')} textClassName="text-red-600" />
          </NMenu>
        </View>
        <View className="p-3 bg-green-50 rounded-lg">
          <NText className="text-green-800 font-semibold">Current Status: {projectStatus.replace('-', ' ')}</NText>
          {projectActions.length > 0 && (
            <View className="mt-2">
              <NText className="text-green-700 text-sm font-medium">Recent Actions:</NText>
              {projectActions.map((action, index) => (
                <NText key={index} className="text-green-600 text-sm">
                  • {action}
                </NText>
              ))}
            </View>
          )}
        </View>
      </NCard>

      {/* Navigation Menu */}
      <NText className="text-xl font-bold mb-3 text-text">Navigation Menu</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-2 flex-wrap">
          <NMenu trigger={<NButton className="bg-teal-500 border-teal-500">Main Menu</NButton>} title="Navigation">
            <NMenuItem title="Dashboard" onPress={() => addMenuAction('Navigate to Dashboard')} />
            <NMenuItem title="Projects" onPress={() => addMenuAction('Navigate to Projects')} />
            <NMenuItem title="Team" onPress={() => addMenuAction('Navigate to Team')} />
            <NMenuItem title="Reports" onPress={() => addMenuAction('Navigate to Reports')} hasSeparator />
            <NMenuItem title="Settings" onPress={() => addMenuAction('Navigate to Settings')} />
          </NMenu>

          <NMenu trigger={<NButton className="bg-orange-500 border-orange-500">Tools</NButton>} title="Developer Tools">
            <NMenuItem title="Code Editor" shortcut="⌘E" onPress={() => addMenuAction('Open Code Editor')} />
            <NMenuItem title="Terminal" shortcut="⌘T" onPress={() => addMenuAction('Open Terminal')} />
            <NMenuItem title="Database" onPress={() => addMenuAction('Open Database')} hasSeparator />
            <NMenuItem title="API Testing" onPress={() => addMenuAction('Open API Testing')} />
            <NMenuItem title="Performance Monitor" onPress={() => addMenuAction('Open Performance Monitor')} />
          </NMenu>

          <NMenu trigger={<NButton className="bg-pink-500 border-pink-500">Help</NButton>} title="Help & Support">
            <NMenuItem title="Documentation" onPress={() => addMenuAction('Open Documentation')} />
            <NMenuItem title="Tutorials" onPress={() => addMenuAction('Open Tutorials')} />
            <NMenuItem title="Keyboard Shortcuts" shortcut="⌘?" onPress={() => addMenuAction('Show Shortcuts')} hasSeparator />
            <NMenuItem title="Contact Support" onPress={() => addMenuAction('Contact Support')} />
            <NMenuItem title="Report Bug" onPress={() => addMenuAction('Report Bug')} />
            <NMenuItem title="Feature Request" onPress={() => addMenuAction('Feature Request')} hasSeparator />
            <NMenuItem title="About" onPress={() => addMenuAction('Show About')} />
          </NMenu>
        </View>
      </NCard>

      {/* Custom Styled Menus */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled Menus</NText>
      <NCard className="mb-6">
        <View className="flex-row gap-2 flex-wrap">
          <NMenu
            trigger={<NButton className="bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500">Gradient Menu</NButton>}
            title="Custom Style"
            className="bg-gradient-to-b from-purple-50 to-pink-50 border-purple-200"
            titleClassName="text-purple-800 font-bold">
            <NMenuItem title="Purple Action" onPress={() => addMenuAction('Purple action triggered')} textClassName="text-purple-700" />
            <NMenuItem title="Pink Action" onPress={() => addMenuAction('Pink action triggered')} textClassName="text-pink-700" />
            <NMenuItem title="Gradient Action" onPress={() => addMenuAction('Gradient action triggered')} textClassName="text-purple-600" />
          </NMenu>

          <NMenu
            trigger={<NButton className="bg-gray-800 border-gray-800 text-white">Dark Menu</NButton>}
            title="Dark Theme"
            className="bg-gray-800 border-gray-700"
            titleClassName="text-gray-100">
            <NMenuItem title="Dark Action 1" onPress={() => addMenuAction('Dark action 1')} textClassName="text-gray-200" />
            <NMenuItem title="Dark Action 2" onPress={() => addMenuAction('Dark action 2')} textClassName="text-gray-200" />
            <NMenuItem title="Dark Action 3" onPress={() => addMenuAction('Dark action 3')} textClassName="text-gray-200" />
          </NMenu>

          <NMenu trigger={<NButton className="bg-yellow-400 border-yellow-400 text-black">Compact Menu</NButton>} className="w-48">
            <NMenuItem title="Quick 1" onPress={() => addMenuAction('Quick action 1')} className="py-1" />
            <NMenuItem title="Quick 2" onPress={() => addMenuAction('Quick action 2')} className="py-1" />
            <NMenuItem title="Quick 3" onPress={() => addMenuAction('Quick action 3')} className="py-1" />
          </NMenu>
        </View>
      </NCard>

      {/* Action Buttons */}
      <View className="flex-row gap-2 mt-4">
        <NButton className="flex-1 bg-red-500 border-red-500" onPress={clearAllActions}>
          Clear Actions
        </NButton>
        <NButton
          className="flex-1 bg-green-500 border-green-500"
          onPress={() => {
            const allData = {
              menuActions,
              fileActions,
              projectActions,
              userProfile,
              selectedFile,
              projectStatus
            };
            console.log('All menu data:', allData);
            NToast.success('Menu data saved!');
          }}>
          Save Data
        </NButton>
      </View>

      {/* Menu Activity Log */}
      <NCard className="mt-6">
        <NText className="text-lg font-bold text-text mb-3">Menu Activity Log</NText>
        {menuActions.length === 0 ? (
          <NText className="text-muted text-sm">No menu actions yet. Try clicking on menu items above!</NText>
        ) : (
          <View className="space-y-1">
            {menuActions.map((action, index) => (
              <NText key={index} className="text-sm text-muted font-mono">
                {action}
              </NText>
            ))}
          </View>
        )}
      </NCard>

      {/* Statistics Summary */}
      <NCard className="mt-4">
        <NText className="text-lg font-bold text-text mb-3">Menu Statistics</NText>
        <View className="space-y-2">
          <NText className="text-sm text-muted">Total Actions: {menuActions.length}</NText>
          <NText className="text-sm text-muted">File Actions: {fileActions.length}</NText>
          <NText className="text-sm text-muted">Project Actions: {projectActions.length}</NText>
          <NText className="text-sm text-muted">
            User Settings: Notifications {userProfile.notifications ? 'ON' : 'OFF'}, Theme {userProfile.darkMode ? 'DARK' : 'LIGHT'}
          </NText>
          <NText className="text-sm text-muted">Current Project Status: {projectStatus.replace('-', ' ').toUpperCase()}</NText>
        </View>
      </NCard>

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2">💡 Menu Best Practices</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Group related actions together with separators{'\n'}• Use keyboard shortcuts for frequently used actions{'\n'}• Provide clear, descriptive
          menu item labels{'\n'}• Use consistent menu structure across your app{'\n'}• Consider menu item order by frequency of use{'\n'}• Use
          appropriate colors for destructive actions (red){'\n'}• Provide visual feedback when menu items are selected{'\n'}• Test menu accessibility
          with screen readers and keyboard navigation
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
