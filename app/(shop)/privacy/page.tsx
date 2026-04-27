export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl py-12 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-semibold text-dark tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

        <div className="prose-custom space-y-8 text-gray-600 text-sm leading-relaxed">
          <p>
            Welcome to CrackNCode (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;). Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.
          </p>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">1. Information We Collect</h2>
            <p className="mb-2">We may collect the following types of information:</p>
            <div className="space-y-3 ml-1">
              <div>
                <h3 className="text-sm font-medium text-dark mb-1">a) Personal Information</h3>
                <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number (if provided)</li>
                  <li>Billing/payment details</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-dark mb-1">b) Account Information</h3>
                <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
                  <li>Login credentials</li>
                  <li>Purchase history</li>
                  <li>Product access data</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-dark mb-1">c) Technical Information</h3>
                <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
                  <li>IP address</li>
                  <li>Browser type</li>
                  <li>Device information</li>
                  <li>Location (approximate)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">2. How We Use Your Information</h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>Process orders and payments</li>
              <li>Provide access to purchased digital products</li>
              <li>Improve our website and services</li>
              <li>Prevent fraud and unauthorized access</li>
              <li>Communicate with you (support, updates, offers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">3. Payment Information</h2>
            <p>All payments are processed securely through third-party payment gateways. We do not store your full payment details on our servers.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">4. Data Protection &amp; Security</h2>
            <p className="mb-2">We implement strong security measures, including:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>Secure authentication system</li>
              <li>Encrypted connections (SSL)</li>
              <li>Access control systems</li>
              <li>Activity monitoring for fraud prevention</li>
            </ul>
            <p className="mt-2 text-gray-400 text-xs">However, no system is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">5. Cookies &amp; Tracking</h2>
            <p className="mb-2">We may use cookies and tracking tools to:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>Improve user experience</li>
              <li>Analyze website traffic</li>
              <li>Provide better recommendations</li>
            </ul>
            <p className="mt-2">You can disable cookies in your browser settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">6. Sharing of Information</h2>
            <p className="mb-2">We do not sell your personal data. We may share data only with:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>Payment providers</li>
              <li>Hosting/service providers</li>
              <li>Legal authorities (if required by law)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">7. User Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>Access your data</li>
              <li>Request correction</li>
              <li>Request deletion (if applicable)</li>
            </ul>
            <p className="mt-2">Contact us to exercise your rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">8. Digital Product Access &amp; Security</h2>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>Purchased products are for personal use only</li>
              <li>Unauthorized sharing or distribution is prohibited</li>
              <li>We may monitor access to prevent misuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy at any time. Changes will be posted on this page.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">10. Contact Us</h2>
            <p className="mb-2">If you have any questions, contact us:</p>
            <div className="space-y-1">
              <p>📧 Email: <a href="mailto:support@crackncode.shop" className="text-primary hover:underline">support@crackncode.shop</a></p>
              <p>🌐 Website: <a href="https://crackncode.shop" className="text-primary hover:underline">crackncode.shop</a></p>
            </div>
          </section>

          <div className="pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400">By using our website, you agree to this Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
