import { useState } from 'react';
import { NButton, NTextarea } from '@nayan-ui/react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Hash,
  Mail,
  MessageSquare,
  RotateCcw,
  Save,
  Star,
  Trash2,
  Type,
  XCircle
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Textarea = () => {
  // Basic textarea
  const [address, setAddress] = useState('Bangalore, India');

  // Comment textarea
  const [comment, setComment] = useState('');

  // Message textarea
  const [message, setMessage] = useState('');

  // Review textarea
  const [review, setReview] = useState('');

  // Description textarea
  const [description, setDescription] = useState('');

  // Feedback textarea
  const [feedback, setFeedback] = useState('');

  // Code textarea
  const [code, setCode] = useState('function hello() {\n  console.log("Hello, World!");\n}');

  // Notes textarea
  const [notes, setNotes] = useState('');

  // Auto-resize textarea
  const [autoResizeText, setAutoResizeText] = useState('This textarea will automatically resize as you type more content...');

  // Character limit textarea
  const [limitedText, setLimitedText] = useState('');
  const characterLimit = 200;

  // Validation states
  const [validationText, setValidationText] = useState('');
  const [validationState, setValidationState] = useState<'normal' | 'success' | 'error' | 'warning'>('normal');

  // Form textarea
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    summary: ''
  });

  // Textarea interaction tracking
  const [textareaHistory, setTextareaHistory] = useState<
    Array<{
      field: string;
      action: string;
      length: number;
      timestamp: string;
    }>
  >([]);

  const logTextareaAction = (field: string, action: string, text: string) => {
    setTextareaHistory(prev => [
      {
        field,
        action,
        length: text.length,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 9) // Keep last 10 actions
    ]);
  };

  const handleTextareaChange = (field: string, value: string, setter: (value: string) => void) => {
    setter(value);
    logTextareaAction(field, 'typed', value);
  };

  const handleValidationChange = (value: string) => {
    setValidationText(value);

    if (value.length === 0) {
      setValidationState('normal');
    } else if (value.length < 10) {
      setValidationState('error');
    } else if (value.length < 20) {
      setValidationState('warning');
    } else {
      setValidationState('success');
    }

    logTextareaAction('Validation Textarea', 'validated', value);
  };

  const clearAllTextareas = () => {
    setAddress('');
    setComment('');
    setMessage('');
    setReview('');
    setDescription('');
    setFeedback('');
    setCode('');
    setNotes('');
    setAutoResizeText('');
    setLimitedText('');
    setValidationText('');
    setFormData({ title: '', content: '', tags: '', summary: '' });
    setTextareaHistory([]);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    logTextareaAction(field, 'copied', text);
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getValidationMessage = () => {
    switch (validationState) {
      case 'success':
        return 'Great! Your text looks good.';
      case 'error':
        return 'Please enter at least 10 characters.';
      case 'warning':
        return 'Consider adding more details.';
      default:
        return 'Enter your text here.';
    }
  };

  const getValidationColor = () => {
    switch (validationState) {
      case 'success':
        return 'border-green-500 focus:ring-green-500';
      case 'error':
        return 'border-red-500 focus:ring-red-500';
      case 'warning':
        return 'border-yellow-500 focus:ring-yellow-500';
      default:
        return 'border-gray-300 focus:ring-blue-500';
    }
  };

  return (
    <ComponentWrapper>
      <div className="space-y-8">
        {/* Basic Textarea */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Basic Textarea</h3>
          <p className="text-gray-600 mb-4">Simple textarea for collecting multi-line text input with labels and placeholders.</p>
          <NTextarea
            id="address"
            label="Address"
            placeholder="Enter your full address"
            className="mb-3"
            rows={3}
            value={address}
            onChange={e => handleTextareaChange('Address', e.target.value, setAddress)}
          />
        </section>

        {/* Textarea Sizes */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Textarea Sizes</h3>
          <p className="text-gray-600 mb-4">Different textarea sizes for various content types and space requirements.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Small (2 rows)</label>
              <NTextarea
                placeholder="Brief comment or note..."
                rows={2}
                value={comment}
                onChange={e => handleTextareaChange('Comment', e.target.value, setComment)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Medium (4 rows)</label>
              <NTextarea
                placeholder="Write your message here..."
                rows={4}
                value={message}
                onChange={e => handleTextareaChange('Message', e.target.value, setMessage)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Large (6 rows)</label>
              <NTextarea
                placeholder="Write a detailed review..."
                rows={6}
                value={review}
                onChange={e => handleTextareaChange('Review', e.target.value, setReview)}
              />
            </div>
          </div>
        </section>

        {/* Disabled Textarea */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Disabled Textarea</h3>
          <p className="text-gray-600 mb-4">Textarea in disabled state to show read-only or unavailable content.</p>
          <NTextarea
            label="System Generated Description"
            value="This content is automatically generated and cannot be edited by users. It provides important system information that should remain unchanged."
            disabled
            rows={3}
            className="opacity-60"
          />
        </section>

        {/* Textarea with Character Limit */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Textarea with Character Limit</h3>
          <p className="text-gray-600 mb-4">Textarea with character counting and limit enforcement for controlled input.</p>
          <div className="space-y-2">
            <NTextarea
              label="Product Description"
              placeholder="Describe your product in 200 characters or less..."
              rows={4}
              value={limitedText}
              onChange={e => {
                const value = e.target.value;
                if (value.length <= characterLimit) {
                  handleTextareaChange('Limited Text', value, setLimitedText);
                }
              }}
              className={limitedText.length > characterLimit * 0.8 ? 'border-yellow-500' : ''}
            />
            <div className="flex justify-between text-sm">
              <span className={`${limitedText.length > characterLimit * 0.8 ? 'text-yellow-600' : 'text-gray-500'}`}>
                {limitedText.length}/{characterLimit} characters
              </span>
              <span className={`${limitedText.length > characterLimit * 0.8 ? 'text-yellow-600' : 'text-gray-500'}`}>
                {characterLimit - limitedText.length} remaining
              </span>
            </div>
          </div>
        </section>

        {/* Auto-resize Textarea */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Auto-resize Textarea</h3>
          <p className="text-gray-600 mb-4">Textarea that automatically adjusts height based on content length.</p>
          <NTextarea
            label="Auto-expanding Notes"
            placeholder="Start typing and watch the textarea grow..."
            value={autoResizeText}
            onChange={e => handleTextareaChange('Auto-resize', e.target.value, setAutoResizeText)}
            className="resize-none overflow-hidden"
            style={{ minHeight: '80px', height: `${Math.max(80, autoResizeText.split('\n').length * 24 + 32)}px` }}
          />
        </section>

        {/* Textarea with Validation */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Textarea with Validation</h3>
          <p className="text-gray-600 mb-4">Textarea with real-time validation feedback and visual state indicators.</p>
          <div className="space-y-2">
            <div className="relative">
              <NTextarea
                label="Feedback"
                placeholder="Please provide your feedback..."
                rows={4}
                value={validationText}
                onChange={e => handleValidationChange(e.target.value)}
                className={`pr-10 ${getValidationColor()}`}
              />
              {getValidationIcon() && <div className="absolute right-3 top-12">{getValidationIcon()}</div>}
            </div>
            <div
              className={`text-sm flex items-center space-x-2 ${
                validationState === 'success'
                  ? 'text-green-600'
                  : validationState === 'error'
                    ? 'text-red-600'
                    : validationState === 'warning'
                      ? 'text-yellow-600'
                      : 'text-gray-500'
              }`}>
              {getValidationIcon()}
              <span>{getValidationMessage()}</span>
            </div>
          </div>
        </section>

        {/* Code Textarea */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Code Textarea</h3>
          <p className="text-gray-600 mb-4">Monospace textarea for code input with syntax-friendly formatting.</p>
          <div className="space-y-2">
            <NTextarea
              label="JavaScript Code"
              placeholder="Enter your code here..."
              rows={6}
              value={code}
              onChange={e => handleTextareaChange('Code', e.target.value, setCode)}
              className="font-mono text-sm bg-gray-50"
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(code, 'Code')}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm transition-colors">
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </button>
              <span className="text-sm text-gray-500">{code.split('\n').length} lines</span>
            </div>
          </div>
        </section>

        {/* Form Example with Multiple Textareas */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Form Example</h3>
          <p className="text-gray-600 mb-4">Complete form with multiple textareas for different types of content input.</p>
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <NTextarea
                label="Article Title"
                placeholder="Enter article title..."
                rows={2}
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <NTextarea
                label="Article Content"
                placeholder="Write your article content here..."
                rows={8}
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div>
              <NTextarea
                label="Tags"
                placeholder="Enter tags separated by commas..."
                rows={2}
                value={formData.tags}
                onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
            <div>
              <NTextarea
                label="Summary"
                placeholder="Brief summary of the article..."
                rows={3}
                value={formData.summary}
                onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-3 pt-4">
              <NButton className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save Article</span>
              </NButton>
              <button
                onClick={() => setFormData({ title: '', content: '', tags: '', summary: '' })}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                <span>Clear Form</span>
              </button>
            </div>
          </div>
        </section>

        {/* Custom Styled Textareas */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Custom Styled Textareas</h3>
          <p className="text-gray-600 mb-4">Textareas with different styling themes and visual treatments.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-700">Primary Theme</label>
              <NTextarea
                placeholder="Primary styled textarea..."
                rows={4}
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 bg-blue-50"
                value={description}
                onChange={e => handleTextareaChange('Description', e.target.value, setDescription)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-green-700">Success Theme</label>
              <NTextarea
                placeholder="Success styled textarea..."
                rows={4}
                className="border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50"
                value={feedback}
                onChange={e => handleTextareaChange('Feedback', e.target.value, setFeedback)}
              />
            </div>
          </div>
        </section>

        {/* Textarea Best Practices */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Textarea Best Practices</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Do's</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Provide clear labels and placeholders</li>
                <li>• Set appropriate default sizes (rows)</li>
                <li>• Include character limits when necessary</li>
                <li>• Provide real-time validation feedback</li>
                <li>• Use monospace fonts for code input</li>
                <li>• Allow resizing when appropriate</li>
                <li>• Include helpful helper text</li>
                <li>• Make textareas accessible with proper ARIA labels</li>
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">❌ Don'ts</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Don't make textareas too small for content</li>
                <li>• Don't forget to handle long text gracefully</li>
                <li>• Don't use textareas for single-line input</li>
                <li>• Don't ignore mobile usability</li>
                <li>• Don't forget to validate user input</li>
                <li>• Don't disable resize without good reason</li>
                <li>• Don't use unclear or missing labels</li>
                <li>• Don't ignore keyboard navigation</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Textarea State Summary */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Textarea State Summary</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Current Textarea States</h4>
              <button
                onClick={clearAllTextareas}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm transition-colors">
                <RotateCcw className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <h5 className="font-medium mb-2">Character Counts</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Address:</span>
                    <span className="text-gray-600">{address.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Message:</span>
                    <span className="text-gray-600">{message.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Review:</span>
                    <span className="text-gray-600">{review.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Code:</span>
                    <span className="text-gray-600">{code.length} chars</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Form Data</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Title:</span>
                    <span className="text-gray-600">{formData.title.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Content:</span>
                    <span className="text-gray-600">{formData.content.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tags:</span>
                    <span className="text-gray-600">{formData.tags.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Summary:</span>
                    <span className="text-gray-600">{formData.summary.length} chars</span>
                  </div>
                </div>
              </div>
            </div>

            {textareaHistory.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Recent Textarea Activity</h5>
                <div className="max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {textareaHistory.map((activity, index) => (
                      <div key={index} className="flex justify-between items-center text-sm py-1 px-2 bg-white rounded">
                        <div className="flex items-center space-x-2">
                          <Type className="w-3 h-3 text-gray-400" />
                          <span className="font-medium">{activity.field}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-blue-600">{activity.action}</span>
                          <span className="text-gray-500">({activity.length} chars)</span>
                        </div>
                        <span className="text-gray-400 text-xs">{activity.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </ComponentWrapper>
  );
};

export default Textarea;
