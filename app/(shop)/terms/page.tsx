import LegalPageTemplate from '@/components/shop/LegalPageTemplate';

const sections = [
  {
    id: 'overview',
    title: { en: 'Overview', bn: 'সংক্ষিপ্ত বিবরণ' },
    content: {
      en: '<p>Welcome to CrackNCode. By accessing or using our website, you agree to comply with and be bound by the following Terms &amp; Conditions. If you do not agree, please do not use our services.</p>',
      bn: '<p>CrackNCode-এ স্বাগতম। আমাদের ওয়েবসাইট অ্যাক্সেস বা ব্যবহার করে, আপনি নিম্নলিখিত শর্তাবলী মেনে চলতে এবং এর দ্বারা আবদ্ধ হতে সম্মত হন। আপনি সম্মত না হলে, অনুগ্রহ করে আমাদের সেবা ব্যবহার করবেন না।</p>',
    },
  },
  {
    id: 'use-of-services',
    title: { en: '1. Use of Our Services', bn: '১. আমাদের সেবা ব্যবহার' },
    content: {
      en: '<ul><li>You must be at least 18 years old or have permission from a guardian</li><li>You agree to use our website only for lawful purposes</li><li>Any misuse of the platform is strictly prohibited</li></ul>',
      bn: '<ul><li>আপনার বয়স কমপক্ষে ১৮ বছর হতে হবে অথবা অভিভাবকের অনুমতি থাকতে হবে</li><li>আপনি শুধুমাত্র বৈধ উদ্দেশ্যে আমাদের ওয়েবসাইট ব্যবহার করতে সম্মত হন</li><li>প্ল্যাটফর্মের যেকোনো অপব্যবহার কঠোরভাবে নিষিদ্ধ</li></ul>',
    },
  },
  {
    id: 'digital-products',
    title: { en: '2. Digital Products', bn: '২. ডিজিটাল পণ্য' },
    content: {
      en: '<ul><li>All products sold on CrackNCode are digital goods</li><li>Products are delivered instantly after successful payment</li><li>You are granted a non-transferable, non-exclusive license for personal use only</li></ul>',
      bn: '<ul><li>CrackNCode-এ বিক্রিত সমস্ত পণ্য ডিজিটাল পণ্য</li><li>সফল পেমেন্টের পরে পণ্য তাৎক্ষণিকভাবে সরবরাহ করা হয়</li><li>আপনাকে শুধুমাত্র ব্যক্তিগত ব্যবহারের জন্য একটি অ-হস্তান্তরযোগ্য, অ-একচেটিয়া লাইসেন্স দেওয়া হয়</li></ul>',
    },
  },
  {
    id: 'account',
    title: { en: '3. Account Responsibility', bn: '৩. অ্যাকাউন্টের দায়িত্ব' },
    content: {
      en: '<ul><li>You are responsible for maintaining the confidentiality of your account</li><li>Any activity under your account is your responsibility</li><li>Sharing login credentials is prohibited</li></ul>',
      bn: '<ul><li>আপনার অ্যাকাউন্টের গোপনীয়তা বজায় রাখার দায়িত্ব আপনার</li><li>আপনার অ্যাকাউন্টের অধীনে যেকোনো কার্যকলাপ আপনার দায়িত্ব</li><li>লগইন তথ্য শেয়ার করা নিষিদ্ধ</li></ul>',
    },
  },
  {
    id: 'payments',
    title: { en: '4. Payments', bn: '৪. পেমেন্ট' },
    content: {
      en: '<ul><li>All payments must be completed through approved payment methods</li><li>We reserve the right to cancel or refuse any order if fraud is suspected</li><li>Prices may change at any time without prior notice</li></ul>',
      bn: '<ul><li>সমস্ত পেমেন্ট অনুমোদিত পেমেন্ট পদ্ধতির মাধ্যমে সম্পন্ন করতে হবে</li><li>জালিয়াতির সন্দেহ হলে যেকোনো অর্ডার বাতিল বা প্রত্যাখ্যান করার অধিকার আমরা সংরক্ষণ করি</li><li>পূর্ব বিজ্ঞপ্তি ছাড়াই যেকোনো সময় মূল্য পরিবর্তন হতে পারে</li></ul>',
    },
  },
  {
    id: 'refund',
    title: { en: '5. Refund Policy', bn: '৫. রিফান্ড নীতি' },
    content: {
      en: '<p>Refunds are governed by our <a href="/refund">Refund Policy</a>. By purchasing, you agree to those terms.</p>',
      bn: '<p>রিফান্ড আমাদের <a href="/refund">রিফান্ড নীতি</a> দ্বারা পরিচালিত হয়। ক্রয় করে, আপনি সেই শর্তাবলীতে সম্মত হন।</p>',
    },
  },
  {
    id: 'ip',
    title: { en: '6. Intellectual Property', bn: '৬. মেধা সম্পত্তি' },
    content: {
      en: '<ul><li>All content, products, and materials are owned by CrackNCode</li><li>You may not copy, resell, distribute, or share any product without permission</li></ul>',
      bn: '<ul><li>সমস্ত কন্টেন্ট, পণ্য এবং উপকরণ CrackNCode-এর মালিকানাধীন</li><li>অনুমতি ছাড়া আপনি কোনো পণ্য কপি, পুনরায় বিক্রি, বিতরণ বা শেয়ার করতে পারবেন না</li></ul>',
    },
  },
  {
    id: 'anti-piracy',
    title: { en: '7. Anti-Piracy & Security', bn: '৭. পাইরেসি বিরোধী ও নিরাপত্তা' },
    content: {
      en: '<ul><li>Unauthorized sharing, distribution, or resale of digital products is strictly prohibited</li><li>We may track usage, IP, and activity to prevent misuse</li><li>Violations may result in account suspension or legal action</li></ul>',
      bn: '<ul><li>ডিজিটাল পণ্যের অননুমোদিত শেয়ারিং, বিতরণ বা পুনরায় বিক্রি কঠোরভাবে নিষিদ্ধ</li><li>অপব্যবহার রোধে আমরা ব্যবহার, আইপি এবং কার্যকলাপ ট্র্যাক করতে পারি</li><li>লঙ্ঘনের ফলে অ্যাকাউন্ট স্থগিত বা আইনি পদক্ষেপ হতে পারে</li></ul>',
    },
  },
  {
    id: 'product-access',
    title: { en: '8. Product Access', bn: '৮. পণ্য অ্যাক্সেস' },
    content: {
      en: '<ul><li>Access to products is granted only after successful payment</li><li>We reserve the right to revoke access in case of misuse or violation</li></ul>',
      bn: '<ul><li>সফল পেমেন্টের পরেই পণ্যে অ্যাক্সেস দেওয়া হয়</li><li>অপব্যবহার বা লঙ্ঘনের ক্ষেত্রে অ্যাক্সেস প্রত্যাহার করার অধিকার আমরা সংরক্ষণ করি</li></ul>',
    },
  },
  {
    id: 'liability',
    title: { en: '9. Limitation of Liability', bn: '৯. দায়বদ্ধতার সীমাবদ্ধতা' },
    content: {
      en: `<p>CrackNCode shall not be liable for:</p>
<ul><li>Any indirect or incidental damages</li><li>Loss of data or business interruption</li><li>Misuse of products by users</li></ul>`,
      bn: `<p>CrackNCode নিম্নলিখিতের জন্য দায়ী থাকবে না:</p>
<ul><li>কোনো পরোক্ষ বা আনুষঙ্গিক ক্ষতি</li><li>ডেটা হারানো বা ব্যবসায়িক বাধা</li><li>ব্যবহারকারীদের দ্বারা পণ্যের অপব্যবহার</li></ul>`,
    },
  },
  {
    id: 'availability',
    title: { en: '10. Service Availability', bn: '১০. সেবার প্রাপ্যতা' },
    content: {
      en: '<ul><li>We do not guarantee uninterrupted access to the website</li><li>Services may be temporarily unavailable due to maintenance or technical issues</li></ul>',
      bn: '<ul><li>আমরা ওয়েবসাইটে নিরবচ্ছিন্ন অ্যাক্সেসের গ্যারান্টি দিই না</li><li>রক্ষণাবেক্ষণ বা প্রযুক্তিগত সমস্যার কারণে সেবা সাময়িকভাবে অনুপলব্ধ হতে পারে</li></ul>',
    },
  },
  {
    id: 'termination',
    title: { en: '11. Termination', bn: '১১. সমাপ্তি' },
    content: {
      en: `<p>We reserve the right to:</p>
<ul><li>Suspend or terminate accounts</li><li>Restrict access to services</li><li>Remove content</li></ul>
<p>if any violation of these Terms is detected.</p>`,
      bn: `<p>এই শর্তাবলীর কোনো লঙ্ঘন সনাক্ত হলে আমরা নিম্নলিখিত অধিকার সংরক্ষণ করি:</p>
<ul><li>অ্যাকাউন্ট স্থগিত বা বন্ধ করা</li><li>সেবায় অ্যাক্সেস সীমাবদ্ধ করা</li><li>কন্টেন্ট অপসারণ করা</li></ul>`,
    },
  },
  {
    id: 'changes',
    title: { en: '12. Changes to Terms', bn: '১২. শর্তাবলীতে পরিবর্তন' },
    content: {
      en: '<p>We may update these Terms &amp; Conditions at any time. Continued use of the website means you accept the updated terms.</p>',
      bn: '<p>আমরা যেকোনো সময় এই শর্তাবলী আপডেট করতে পারি। ওয়েবসাইটের ক্রমাগত ব্যবহার মানে আপনি আপডেট করা শর্তাবলী গ্রহণ করেন।</p>',
    },
  },
  {
    id: 'governing-law',
    title: { en: '13. Governing Law', bn: '১৩. প্রযোজ্য আইন' },
    content: {
      en: '<p>These Terms shall be governed by and interpreted in accordance with the applicable laws of Bangladesh.</p>',
      bn: '<p>এই শর্তাবলী বাংলাদেশের প্রযোজ্য আইন অনুসারে পরিচালিত এবং ব্যাখ্যা করা হবে।</p>',
    },
  },
  {
    id: 'contact',
    title: { en: '14. Contact Us', bn: '১৪. যোগাযোগ করুন' },
    content: {
      en: '<p>For any questions:</p><p>📧 Email: <a href="mailto:support@crackncode.shop">support@crackncode.shop</a></p><p>🌐 Website: <a href="https://crackncode.shop">crackncode.shop</a></p>',
      bn: '<p>কোনো প্রশ্নের জন্য:</p><p>📧 ইমেইল: <a href="mailto:support@crackncode.shop">support@crackncode.shop</a></p><p>🌐 ওয়েবসাইট: <a href="https://crackncode.shop">crackncode.shop</a></p>',
    },
  },
];

export default function TermsPage() {
  return (
    <LegalPageTemplate
      title={{ en: 'Terms & Conditions', bn: 'শর্তাবলী' }}
      sections={sections}
    />
  );
}
