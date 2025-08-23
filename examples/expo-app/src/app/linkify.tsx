import { Alert, ScrollView, View } from 'react-native';
import { NCard, NLinkify, NText, NToast } from '@nayan-ui/react-native';

const Component = () => {
  const handleLinkPress = (url: string, text: string) => {
    NToast.info(`Link pressed: ${text} (${url})`);
  };

  const handleEmailPress = (email: string) => {
    Alert.alert('Email Action', `Would you like to send an email to ${email}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send Email', onPress: () => NToast.success(`Opening email client for ${email}`) }
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic URL and Email Detection */}
      <NText className="text-xl font-bold mb-3 text-text">Basic URL and Email Detection</NText>

      <NCard className="p-4 mb-6">
        <NLinkify>
          <NText className="mb-4">
            Visit our website at https://www.nayanui.com for comprehensive documentation and examples. You can also check out our GitHub repository at
            github.com/ursnj/nayan-ui for source code.
          </NText>
        </NLinkify>

        <NLinkify>
          <NText className="mb-4">
            For support, email us at support@nayanui.com or hello@nayanui.com. Our team typically responds within 24 hours.
          </NText>
        </NLinkify>

        <NLinkify>
          <NText>Mixed content: Check our docs at www.nayanui.com/docs or email questions to help@nayanui.com</NText>
        </NLinkify>
      </NCard>

      {/* Custom Link Styling */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Link Styling</NText>

      <NCard className="p-4 mb-6">
        <NLinkify linkStyle={{ color: '#3b82f6', textDecorationLine: 'underline', fontWeight: 'bold' }}>
          <NText className="mb-4">Blue bold underlined links: Visit https://www.nayanui.com or email contact@nayanui.com</NText>
        </NLinkify>

        <NLinkify linkStyle={{ color: '#ef4444', fontSize: 16 }}>
          <NText className="mb-4">Red larger links: Check out our blog at blog.nayanui.com</NText>
        </NLinkify>

        <NLinkify linkStyle={{ color: '#10b981', backgroundColor: '#dcfce7', padding: 2, borderRadius: 4 }}>
          <NText>Highlighted green links: Documentation at docs.nayanui.com</NText>
        </NLinkify>
      </NCard>

      {/* Custom Link Handlers */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Link Handlers</NText>

      <NCard className="p-4 mb-6">
        <NLinkify onPress={handleLinkPress}>
          <NText className="mb-4">Custom URL handler: Visit https://www.nayanui.com or https://github.com/ursnj/nayan-ui</NText>
        </NLinkify>

        <NLinkify onPress={(url, text) => handleEmailPress(url.replace('mailto:', ''))}>
          <NText className="mb-4">Custom email handler: Contact us at support@nayanui.com or sales@nayanui.com</NText>
        </NLinkify>
      </NCard>

      {/* Social Media Links */}
      <NText className="text-xl font-bold mb-3 text-text">Social Media and Various URLs</NText>

      <NCard className="p-4 mb-6">
        <NLinkify>
          <NText className="mb-4">
            Follow us on social media:
            {'\n'}• Twitter: https://twitter.com/nayanui
            {'\n'}• LinkedIn: https://linkedin.com/company/nayan-ui
            {'\n'}• Instagram: https://instagram.com/nayanui
          </NText>
        </NLinkify>

        <NLinkify>
          <NText className="mb-4">
            Development resources:
            {'\n'}• GitHub: github.com/ursnj/nayan-ui
            {'\n'}• NPM: npmjs.com/package/@nayan-ui/react-native
            {'\n'}• Docs: docs.nayanui.com
          </NText>
        </NLinkify>

        <NLinkify>
          <NText>Secure links: https://secure.nayanui.com and http://legacy.nayanui.com</NText>
        </NLinkify>
      </NCard>

      {/* Complex Text with Multiple Links */}
      <NText className="text-xl font-bold mb-3 text-text">Complex Text with Multiple Links</NText>

      <NCard className="p-4 mb-6">
        <NLinkify>
          <NText className="mb-4">
            Welcome to Nayan UI! 🎉 We're excited to have you here. To get started, visit our documentation at https://docs.nayanui.com where you'll
            find comprehensive guides and examples.
            {'\n\n'}If you need help, don't hesitate to reach out:
            {'\n'}📧 Email: support@nayanui.com
            {'\n'}🌐 Website: www.nayanui.com
            {'\n\n'}You can also join our community on Discord at discord.gg/nayanui or follow our updates on Twitter @nayanui. For enterprise
            inquiries, contact enterprise@nayanui.com.
          </NText>
        </NLinkify>
      </NCard>

      {/* Email Variations */}
      <NText className="text-xl font-bold mb-3 text-text">Email Address Variations</NText>

      <NCard className="p-4 mb-6">
        <NLinkify>
          <NText className="mb-4">
            Different email formats:
            {'\n'}• Standard: john.doe@example.com
            {'\n'}• With numbers: user123@domain.org
            {'\n'}• Subdomain: admin@mail.company.co.uk
            {'\n'}• Plus addressing: user+tag@gmail.com
          </NText>
        </NLinkify>

        <NLinkify>
          <NText>Department emails: sales@nayanui.com, support@nayanui.com, hr@nayanui.com, dev@nayanui.com</NText>
        </NLinkify>
      </NCard>

      {/* URL Variations */}
      <NText className="text-xl font-bold mb-3 text-text">URL Variations and Formats</NText>

      <NCard className="p-4 mb-6">
        <NLinkify>
          <NText className="mb-4">
            Different URL formats:
            {'\n'}• With protocol: https://www.nayanui.com
            {'\n'}• Without protocol: www.nayanui.com
            {'\n'}• Subdomain: api.nayanui.com
            {'\n'}• With path: nayanui.com/docs/getting-started
            {'\n'}• With query: search.nayanui.com?q=components
          </NText>
        </NLinkify>

        <NLinkify>
          <NText className="mb-4">
            Special domains:
            {'\n'}• Short domain: bit.ly/nayanui
            {'\n'}• Country code: nayanui.co.uk
            {'\n'}• New TLD: nayanui.dev
          </NText>
        </NLinkify>

        <NLinkify>
          <NText>Local development: localhost:3000, 127.0.0.1:8080, dev.local:3000</NText>
        </NLinkify>
      </NCard>

      {/* Real-world Use Cases */}
      <NText className="text-xl font-bold mb-3 text-text">Real-world Use Cases</NText>

      <NCard className="p-4 mb-6">
        <View className="mb-4">
          <NText className="font-semibold mb-2">📧 Email Signature</NText>
          <NLinkify>
            <NText className="text-sm">
              John Doe{'\n'}
              Senior Developer{'\n'}
              Nayan UI Inc.{'\n'}
              📧 john.doe@nayanui.com{'\n'}
              🌐 www.nayanui.com
            </NText>
          </NLinkify>
        </View>

        <View className="mb-4">
          <NText className="font-semibold mb-2">📱 App Description</NText>
          <NLinkify>
            <NText className="text-sm">
              Nayan UI is a comprehensive React Native component library. Download it from npmjs.com/package/@nayan-ui/react-native or visit our
              GitHub repository at github.com/ursnj/nayan-ui. For questions, email support@nayanui.com.
            </NText>
          </NLinkify>
        </View>

        <View>
          <NText className="font-semibold mb-2">🎫 Support Ticket</NText>
          <NLinkify>
            <NText className="text-sm">
              Issue reported by user@company.com on 2024-01-15. Related documentation: docs.nayanui.com/troubleshooting Contact developer at
              dev@nayanui.com for urgent issues.
            </NText>
          </NLinkify>
        </View>
      </NCard>

      {/* Best Practices */}
      <NCard className="p-4 mb-6">
        <NText className="text-lg font-semibold mb-3">💡 Linkify Best Practices</NText>
        <View className="space-y-2">
          <NText className="text-sm">• Wrap text content that may contain URLs and emails</NText>
          <NText className="text-sm">• Use custom onPress handlers for specific link behaviors</NText>
          <NText className="text-sm">• Apply consistent link styling across your app with linkStyle prop</NText>
          <NText className="text-sm">• Test with various URL formats (with/without protocol, subdomains, etc.)</NText>
          <NText className="text-sm">• Consider accessibility - ensure links are clearly distinguishable</NText>
          <NText className="text-sm">• Handle edge cases like malformed URLs gracefully</NText>
          <NText className="text-sm">• Provide feedback when links are pressed (toasts, alerts, etc.)</NText>
        </View>
      </NCard>
    </ScrollView>
  );
};

export default Component;
