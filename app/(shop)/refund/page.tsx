export default function RefundPage() {
  return (
    <div className="min-h-screen bg-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl py-12 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-semibold text-dark tracking-tight mb-2">Refund Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

        <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
          <p>
            This Refund Policy outlines the terms and conditions under which refunds may be issued for purchases made on CrackNCode. By completing a purchase on our website, you agree to the terms described below.
          </p>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">1. Nature of Digital Products</h2>
            <p>All products sold on CrackNCode are digital goods. Due to the nature of digital content, items are delivered instantly and are generally non-refundable once accessed or downloaded.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">2. Non-Delivery of Product</h2>
            <p className="mb-2">If you do not receive access to your purchased product:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>You must notify us within 48 hours of the transaction.</li>
              <li>Our team will investigate and verify the issue.</li>
              <li>If it is confirmed that the product was not delivered due to a system error, we will either:
                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                  <li>Provide immediate access, or</li>
                  <li>Issue a refund (if delivery cannot be fulfilled)</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">3. Product-Related Issues</h2>
            <p className="mb-2">If you experience technical issues or problems with a product:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>You must contact our support team with clear details.</li>
              <li>Each case will be reviewed individually.</li>
              <li>Depending on the situation, we may:
                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                  <li>Provide assistance or fixes</li>
                  <li>Replace the product</li>
                  <li>Approve a refund (at our sole discretion)</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">4. Refund Processing</h2>
            <p className="mb-2">If a refund is approved:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>It will be processed within 2–3 business days</li>
              <li>The actual time for the funds to reflect may vary depending on your payment provider</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">5. Non-Refundable Situations</h2>
            <p className="mb-2">Refund requests will not be accepted in the following cases:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500">
              <li>The product has already been accessed or downloaded</li>
              <li>Change of mind after purchase</li>
              <li>Lack of knowledge or inability to use the product</li>
              <li>Accidental or incorrect purchase by the user</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">6. Fraud Prevention &amp; Abuse</h2>
            <p>To protect our platform:</p>
            <ul className="list-disc ml-5 space-y-0.5 text-gray-500 mt-2">
              <li>We reserve the right to deny refund requests in cases of suspicious or abusive behavior</li>
              <li>Accounts involved in misuse, fraud, or unauthorized sharing may be restricted or terminated</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">7. Limitation of Liability</h2>
            <p>CrackNCode shall not be held liable for any indirect or incidental losses arising from the use of our digital products.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">8. Policy Updates</h2>
            <p>We reserve the right to modify this Refund Policy at any time. Updated versions will be posted on this page.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-dark mb-3">9. Contact Information</h2>
            <p className="mb-2">For any refund-related inquiries:</p>
            <div className="space-y-1">
              <p>📧 Email: <a href="mailto:support@crackncode.shop" className="text-primary hover:underline">support@crackncode.shop</a></p>
              <p>🌐 Website: <a href="https://crackncode.shop" className="text-primary hover:underline">crackncode.shop</a></p>
            </div>
          </section>

          <div className="pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400">By purchasing from CrackNCode, you acknowledge that you have read, understood, and agreed to this Refund Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
