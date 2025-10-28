import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NCard, NText, NTextarea, NToast } from '@nayan-ui/react-native';

const Component = () => {
  // Basic textarea states
  const [basicText, setBasicText] = useState('');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [review, setReview] = useState('');
  const [comment, setComment] = useState('');
  const [bio, setBio] = useState('');

  // Form states
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    details: ''
  });

  const [blogPost, setBlogPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    tags: ''
  });

  const [productReview, setProductReview] = useState({
    summary: '',
    pros: '',
    cons: '',
    experience: ''
  });

  // Character limits
  const [limitedText, setLimitedText] = useState('');
  const [tweetText, setTweetText] = useState('');
  const [bioText, setBioText] = useState('');

  // Code and technical content
  const [codeSnippet, setCodeSnippet] = useState(`function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`);

  const [jsonData, setJsonData] = useState(`{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}`);

  const [sqlQuery, setSqlQuery] = useState(`SELECT u.name, u.email, p.title
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.active = true
ORDER BY p.created_at DESC
LIMIT 10;`);

  // Validation states
  const [validatedText, setValidatedText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('Valid content here!');

  const CHARACTER_LIMITS = {
    tweet: 280,
    bio: 160,
    limited: 500
  };

  const updateContactForm = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  const updateBlogPost = (field: string, value: string) => {
    setBlogPost(prev => ({ ...prev, [field]: value }));
  };

  const updateProductReview = (field: string, value: string) => {
    setProductReview(prev => ({ ...prev, [field]: value }));
  };

  const handleLimitedTextChange = (text: string) => {
    if (text.length <= CHARACTER_LIMITS.limited) {
      setLimitedText(text);
    } else {
      NToast.warning(`Character limit exceeded! Maximum ${CHARACTER_LIMITS.limited} characters allowed.`);
    }
  };

  const handleTweetChange = (text: string) => {
    if (text.length <= CHARACTER_LIMITS.tweet) {
      setTweetText(text);
    } else {
      NToast.warning(`Tweet too long! Maximum ${CHARACTER_LIMITS.tweet} characters allowed.`);
    }
  };

  const handleBioChange = (text: string) => {
    if (text.length <= CHARACTER_LIMITS.bio) {
      setBioText(text);
    } else {
      NToast.warning(`Bio too long! Maximum ${CHARACTER_LIMITS.bio} characters allowed.`);
    }
  };

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleValidatedTextChange = (text: string) => {
    setValidatedText(text);
    if (text.length > 0 && text.length < 10) {
      setErrorText('Text must be at least 10 characters long');
    } else if (text.includes('@') && !validateEmail(text)) {
      setErrorText('Please enter a valid email address');
    } else {
      setErrorText('');
    }
  };

  const clearAllTextareas = () => {
    setBasicText('');
    setDescription('');
    setFeedback('');
    setNotes('');
    setMessage('');
    setReview('');
    setComment('');
    setBio('');
    setContactForm({ subject: '', message: '', details: '' });
    setBlogPost({ title: '', excerpt: '', content: '', tags: '' });
    setProductReview({ summary: '', pros: '', cons: '', experience: '' });
    setLimitedText('');
    setTweetText('');
    setBioText('');
    setValidatedText('');
    setErrorText('');
    NToast.success('All textareas cleared');
  };

  const saveAllContent = () => {
    const allContent = {
      basic: { basicText, description, feedback, notes, message, review, comment, bio },
      forms: { contactForm, blogPost, productReview },
      limited: { limitedText, tweetText, bioText },
      code: { codeSnippet, jsonData, sqlQuery },
      validated: { validatedText, successText }
    };
    console.log('All content saved:', allContent);
    NToast.success('All content saved successfully!');
  };

  const getCharacterCountColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-500';
    return 'text-muted';
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Basic Textarea */}
      <NText className="text-xl font-bold mb-3 text-text">Basic Textarea</NText>
      <NCard className="mb-6">
        <NTextarea
          label="Basic Textarea"
          placeholder="Enter your text here..."
          value={basicText}
          onChangeText={text => {
            setBasicText(text);
            if (text.length > 50) {
              NToast.info('Getting lengthy! Consider breaking into paragraphs.');
            }
          }}
        />
      </NCard>

      {/* Different Sizes */}
      <NText className="text-xl font-bold mb-3 text-text">Different Sizes</NText>
      <NCard className="mb-6">
        <NTextarea
          label="Small Textarea"
          placeholder="Small textarea (3 lines)"
          value={description}
          onChangeText={setDescription}
          inputClassName="min-h-[80px]"
          className="mb-4"
        />
        <NTextarea
          label="Medium Textarea"
          placeholder="Medium textarea (5 lines)"
          value={feedback}
          onChangeText={setFeedback}
          inputClassName="min-h-[120px]"
          className="mb-4"
        />
        <NTextarea
          label="Large Textarea"
          placeholder="Large textarea (8 lines)"
          value={notes}
          onChangeText={setNotes}
          inputClassName="min-h-[200px]"
        />
      </NCard>

      {/* Contact Form */}
      <NText className="text-xl font-bold mb-3 text-text">Contact Form</NText>
      <NCard className="mb-6">
        <NTextarea
          label="Subject"
          placeholder="Brief subject line..."
          value={contactForm.subject}
          onChangeText={text => updateContactForm('subject', text)}
          inputClassName="min-h-[60px]"
          className="mb-4"
        />
        <NTextarea
          label="Message"
          placeholder="Your message here..."
          value={contactForm.message}
          onChangeText={text => updateContactForm('message', text)}
          inputClassName="min-h-[120px]"
          className="mb-4"
        />
        <NTextarea
          label="Additional Details"
          placeholder="Any additional information..."
          value={contactForm.details}
          onChangeText={text => updateContactForm('details', text)}
          inputClassName="min-h-[100px]"
        />
        <NButton
          className="mt-4 bg-blue-500 border-blue-500"
          onPress={() => {
            if (contactForm.subject && contactForm.message) {
              NToast.success('Contact form submitted!');
              setContactForm({ subject: '', message: '', details: '' });
            } else {
              NToast.warning('Please fill in subject and message');
            }
          }}>
          Submit Contact Form
        </NButton>
      </NCard>

      {/* Blog Post Editor */}
      <NText className="text-xl font-bold mb-3 text-text">Blog Post Editor</NText>
      <NCard className="mb-6">
        <NTextarea
          label="Post Title"
          placeholder="Enter your blog post title..."
          value={blogPost.title}
          onChangeText={text => updateBlogPost('title', text)}
          inputClassName="min-h-[60px]"
          className="mb-4"
        />
        <NTextarea
          label="Excerpt"
          placeholder="Brief description or excerpt..."
          value={blogPost.excerpt}
          onChangeText={text => updateBlogPost('excerpt', text)}
          inputClassName="min-h-[80px]"
          className="mb-4"
        />
        <NTextarea
          label="Content"
          placeholder="Write your blog post content here..."
          value={blogPost.content}
          onChangeText={text => updateBlogPost('content', text)}
          inputClassName="min-h-[200px]"
          className="mb-4"
        />
        <NTextarea
          label="Tags"
          placeholder="Enter tags separated by commas..."
          value={blogPost.tags}
          onChangeText={text => updateBlogPost('tags', text)}
          inputClassName="min-h-[60px]"
        />
        <View className="mt-4 flex-row gap-2">
          <NButton className="flex-1 bg-gray-500 border-gray-500" onPress={() => setBlogPost({ title: '', excerpt: '', content: '', tags: '' })}>
            Clear Draft
          </NButton>
          <NButton
            className="flex-1 bg-green-500 border-green-500"
            onPress={() => {
              if (blogPost.title && blogPost.content) {
                NToast.success('Blog post saved as draft!');
              } else {
                NToast.warning('Please add title and content');
              }
            }}>
            Save Draft
          </NButton>
        </View>
      </NCard>

      {/* Product Review */}
      <NText className="text-xl font-bold mb-3 text-text">Product Review</NText>
      <NCard className="mb-6">
        <NTextarea
          label="Review Summary"
          placeholder="Brief summary of your review..."
          value={productReview.summary}
          onChangeText={text => updateProductReview('summary', text)}
          inputClassName="min-h-[80px]"
          className="mb-4"
        />
        <NTextarea
          label="Pros"
          placeholder="What did you like about this product?"
          value={productReview.pros}
          onChangeText={text => updateProductReview('pros', text)}
          inputClassName="min-h-[100px]"
          className="mb-4"
        />
        <NTextarea
          label="Cons"
          placeholder="What could be improved?"
          value={productReview.cons}
          onChangeText={text => updateProductReview('cons', text)}
          inputClassName="min-h-[100px]"
          className="mb-4"
        />
        <NTextarea
          label="Overall Experience"
          placeholder="Describe your overall experience..."
          value={productReview.experience}
          onChangeText={text => updateProductReview('experience', text)}
          inputClassName="min-h-[120px]"
        />
        <NButton
          className="mt-4 bg-yellow-500 border-yellow-500"
          onPress={() => {
            if (productReview.summary && productReview.experience) {
              NToast.success('Product review submitted!');
              setProductReview({ summary: '', pros: '', cons: '', experience: '' });
            } else {
              NToast.warning('Please add summary and overall experience');
            }
          }}>
          Submit Review
        </NButton>
      </NCard>

      {/* Character Limits */}
      <NText className="text-xl font-bold mb-3 text-text">Character Limits</NText>
      <NCard className="mb-6">
        <View className="mb-4">
          <NTextarea
            label="Limited Text (500 chars)"
            placeholder="Enter text with character limit..."
            value={limitedText}
            onChangeText={handleLimitedTextChange}
            inputClassName="min-h-[100px]"
          />
          <NText className={`text-sm mt-1 ${getCharacterCountColor(limitedText.length, CHARACTER_LIMITS.limited)}`}>
            {limitedText.length}/{CHARACTER_LIMITS.limited} characters
          </NText>
        </View>

        <View className="mb-4">
          <NTextarea
            label="Tweet (280 chars)"
            placeholder="What's happening?"
            value={tweetText}
            onChangeText={handleTweetChange}
            inputClassName="min-h-[80px]"
          />
          <NText className={`text-sm mt-1 ${getCharacterCountColor(tweetText.length, CHARACTER_LIMITS.tweet)}`}>
            {tweetText.length}/{CHARACTER_LIMITS.tweet} characters
          </NText>
        </View>

        <View>
          <NTextarea
            label="Bio (160 chars)"
            placeholder="Tell us about yourself..."
            value={bioText}
            onChangeText={handleBioChange}
            inputClassName="min-h-[80px]"
          />
          <NText className={`text-sm mt-1 ${getCharacterCountColor(bioText.length, CHARACTER_LIMITS.bio)}`}>
            {bioText.length}/{CHARACTER_LIMITS.bio} characters
          </NText>
        </View>
      </NCard>

      {/* Code Input */}
      <NText className="text-xl font-bold mb-3 text-text">Code & Technical Content</NText>
      <NCard className="mb-6">
        <NTextarea
          label="JavaScript Code"
          placeholder="Enter your JavaScript code..."
          value={codeSnippet}
          onChangeText={setCodeSnippet}
          inputClassName="min-h-[150px] font-mono text-sm bg-gray-900 text-green-400 border-gray-700"
          className="mb-4"
        />
        <NTextarea
          label="JSON Data"
          placeholder="Enter JSON data..."
          value={jsonData}
          onChangeText={setJsonData}
          inputClassName="min-h-[120px] font-mono text-sm bg-gray-100 border-gray-300"
          className="mb-4"
        />
        <NTextarea
          label="SQL Query"
          placeholder="Enter SQL query..."
          value={sqlQuery}
          onChangeText={setSqlQuery}
          inputClassName="min-h-[120px] font-mono text-sm bg-blue-50 border-blue-200"
        />
      </NCard>

      {/* Validation States */}
      <NText className="text-xl font-bold mb-3 text-text">Validation States</NText>
      <NCard className="mb-6">
        <View className="mb-4">
          <NTextarea
            label="Validated Input"
            placeholder="Enter text (min 10 characters) or email..."
            value={validatedText}
            onChangeText={handleValidatedTextChange}
            inputClassName={`min-h-[80px] ${errorText ? 'border-red-500 bg-red-50' : validatedText.length >= 10 ? 'border-green-500 bg-green-50' : ''}`}
          />
          {errorText && <NText className="text-red-600 text-sm mt-1">❌ {errorText}</NText>}
          {!errorText && validatedText.length >= 10 && <NText className="text-green-600 text-sm mt-1">✅ Input is valid</NText>}
        </View>

        <View className="mb-4">
          <NTextarea
            label="Success State"
            placeholder="This field has valid content"
            value={successText}
            onChangeText={setSuccessText}
            inputClassName="min-h-[80px] border-green-500 bg-green-50"
          />
          <NText className="text-green-600 text-sm mt-1">✅ Content validated successfully</NText>
        </View>

        <View>
          <NTextarea
            label="Warning State"
            placeholder="This field needs attention"
            value="This content might need review..."
            onChangeText={() => {}}
            inputClassName="min-h-[80px] border-yellow-500 bg-yellow-50"
          />
          <NText className="text-yellow-600 text-sm mt-1">⚠️ Please review this content</NText>
        </View>
      </NCard>

      {/* Disabled Textarea */}
      <NText className="text-xl font-bold mb-3 text-text">Disabled Textarea</NText>
      <NCard className="mb-6">
        <NTextarea
          label="Read-only Content"
          placeholder="This textarea is disabled"
          value="This content cannot be edited. It's in read-only mode for display purposes."
          onChangeText={() => {}}
          disabled={true}
          inputClassName="min-h-[80px]"
        />
        <NText className="text-sm text-muted mt-2">This textarea is disabled and cannot be edited.</NText>
      </NCard>

      {/* Custom Styled */}
      <NText className="text-xl font-bold mb-3 text-text">Custom Styled</NText>
      <NCard className="mb-6">
        <NTextarea
          label="Custom Purple Theme"
          placeholder="Custom styled textarea..."
          value={message}
          onChangeText={setMessage}
          labelClassName="text-purple-600 font-semibold"
          inputClassName="min-h-[100px] border-purple-300 bg-purple-50 text-purple-800"
          className="mb-4"
        />
        <NTextarea
          label="Large Text Area"
          placeholder="Large textarea with custom styling..."
          value={review}
          onChangeText={setReview}
          labelClassName="text-lg font-bold text-blue-600"
          inputClassName="min-h-[150px] text-lg border-2 border-blue-300 rounded-lg"
          className="mb-4"
        />
        <NTextarea
          label="Compact Style"
          placeholder="Compact textarea..."
          value={comment}
          onChangeText={setComment}
          labelClassName="text-sm font-medium"
          inputClassName="min-h-[60px] text-sm border border-gray-200 rounded"
        />
      </NCard>

      {/* Action Buttons */}
      <View className="flex-row gap-2 mt-4">
        <NButton className="flex-1 bg-red-500 border-red-500" onPress={clearAllTextareas}>
          Clear All
        </NButton>
        <NButton className="flex-1 bg-green-500 border-green-500" onPress={saveAllContent}>
          Save All
        </NButton>
      </View>

      {/* Content Summary */}
      <NCard className="mt-6">
        <NText className="text-lg font-bold text-text mb-3">Content Summary</NText>
        <View className="space-y-2">
          <NText className="text-sm text-muted">
            Basic fields filled: {[basicText, description, feedback, notes, message, review, comment, bio].filter(Boolean).length}/8
          </NText>
          <NText className="text-sm text-muted">Contact form progress: {Object.values(contactForm).filter(Boolean).length}/3 fields</NText>
          <NText className="text-sm text-muted">Blog post progress: {Object.values(blogPost).filter(Boolean).length}/4 fields</NText>
          <NText className="text-sm text-muted">Review progress: {Object.values(productReview).filter(Boolean).length}/4 fields</NText>
          <NText className="text-sm text-muted">Character-limited fields: {[limitedText, tweetText, bioText].filter(Boolean).length}/3 filled</NText>
          <NText className="text-sm text-muted">
            Total characters entered:{' '}
            {
              [
                basicText,
                description,
                feedback,
                notes,
                message,
                review,
                comment,
                bio,
                ...Object.values(contactForm),
                ...Object.values(blogPost),
                ...Object.values(productReview),
                limitedText,
                tweetText,
                bioText,
                codeSnippet,
                jsonData,
                sqlQuery,
                validatedText
              ].join('').length
            }
          </NText>
        </View>
      </NCard>

      {/* Help Section */}
      <View className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <NText className="text-blue-800 font-semibold mb-2">💡 Textarea Best Practices</NText>
        <NText className="text-blue-700 text-sm leading-relaxed">
          • Use appropriate heights for different content types{'\n'}• Implement character limits for social media or constrained content{'\n'}•
          Provide real-time validation feedback{'\n'}• Use monospace fonts for code input{'\n'}• Consider auto-save functionality for long-form
          content{'\n'}• Provide clear labels and helpful placeholder text{'\n'}• Use visual states (success, error, warning) for feedback{'\n'}• Test
          with keyboard navigation and screen readers
        </NText>
      </View>
    </ScrollView>
  );
};

export default Component;
