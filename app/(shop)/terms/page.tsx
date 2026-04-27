export default function TermsPage() {
  return (
    <div className="min-h-screen bg-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl py-12 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-semibold text-dark tracking-tight mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

        <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
          <p>
            Welcome to CrackNCode. By accessing or using our website, you agree to comply with and be bound by the following Terms &amp; Conditions. If you do not agree, please do not use our services.
          </p>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">1. Use of Our Services</h2>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>You must be at least 18 years old or have permission from a guardian</li>
              <li>You agree to use our website only for lawful purposes</li>
              <li>Any misuse of the platform is strictly prohibited</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">2. Digital Products</h2>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>All products sold on CrackNCode are digital goods</li>
              <li>Products are delivered instantly after successful payment</li>
              <li>You are granted a non-transferable, non-exclusive license for personal use only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">3. Account Responsibility</h2>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>Any activity under your account is your responsibility</li>
              <li>Sharing login credentials is prohibited</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">4. Payments</h2>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>All payments must be completed through approved payment methods</li>
              <li>We reserve the right to cancel or refuse any order if fraud is suspected</li>
              <li>Prices may change at any time without prior notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">5. Refund Policy</h2>
            <p>Refunds are governed by our <a href="/refund" className="text-primary hover:underline">Refund Policy</a>. By purchasing, you agree to those terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">6. Intellectual Property</h2>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>All content, products, and materials are owned by CrackNCode</li>
              <li>You may not copy, resell, distribute, or share any product without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">7. Anti-Piracy &amp; Security</h2>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>Unauthorized sharing, distribution, or resale of digital products is strictly prohibited</li>
              <li>We may track usage, IP, and activity to prevent misuse</li>
              <li>Violations may result in account suspension or legal action</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">8. Product Access</h2>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>Access to products is granted only after successful payment</li>
              <li>We reserve the right to revoke access in case of misuse or violation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">9. Limitation of Liability</h2>
            <p className="mb-2">CrackNCode shall not be liable for:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>Any indirect or incidental damages</li>
              <li>Loss of data or business interruption</li>
              <li>Misuse of products by users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">10. Service Availability</h2>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>We do not guarantee uninterrupted access to the website</li>
              <li>Services may be temporarily unavailable due to maintenance or technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">11. Termination</h2>
            <p className="mb-2">We reserve the right to:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>Suspend or terminate accounts</li>
              <li>Restrict access to services</li>
              <li>Remove content</li>
            </ul>
            <p className="mt-2">if any violation of these Terms is detected.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">12. Changes to Terms</h2>
            <p>We may update these Terms &amp; Conditions at any time. Continued use of the website means you accept the updated terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">13. Governing Law</h2>
            <p>These Terms shall be governed by and interpreted in accordance with the applicable laws of Bangladesh.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">14. Contact Us</h2>
            <p className="mb-2">For any questions:</p>
            <div className="space-y-1">
              <p>📧 Email: <a href="mailto:support@crackncode.shop" className="text-primary hover:underline">support@crackncode.shop</a></p>
              <p>🌐 Website: <a href="https://crackncode.shop" className="text-primary hover:underline">crackncode.shop</a></p>
            </div>
          </section>

          <div className="pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400">By using our website, you confirm that you have read and agreed to these Terms &amp; Conditions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
