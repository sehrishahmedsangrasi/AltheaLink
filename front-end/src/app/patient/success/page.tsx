export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-7" style={{ backgroundColor: '#E1E9F1' }}>
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="rounded-3xl shadow-2xl p-8 md:p-12 text-center" style={{ backgroundColor: '#FFFFFF' }}>
          
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center animate-bounce" style={{ backgroundColor: '#5DC4C7' }}>
                <svg className="w-12 h-12" style={{ color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Decorative circles */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full animate-pulse" style={{ backgroundColor: '#5DC4C7', opacity: 0.4 }}></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: '#5DC4C7', opacity: 0.3 }}></div>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#06434D' }}>
            Appointment Confirmed!
          </h1>
          
          <div className="mb-8">
            <p className="text-lg mb-3" style={{ color: '#06434D', opacity: 0.8 }}>
               Your appointment has been successfully booked!
            </p>
            <p className="text-base" style={{ color: '#06434D', opacity: 0.6 }}>
              We've sent a confirmation email with your appointment details.
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-2xl p-6 mb-8 border-2" style={{ 
            backgroundColor: '#E1E9F1',
            borderColor: '#5DC4C7'
          }}>
            <div className="flex items-start gap-3 text-left">
              <svg className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#5DC4C7' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: '#06434D' }}>
                  What's Next?
                </h3>
                <ul className="text-sm space-y-1" style={{ color: '#06434D', opacity: 0.7 }}>
                  <li>• Check your email for confirmation details</li>
                  <li>• Please arrive 15 minutes early</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: '#06434D',
                color: '#FFFFFF'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Homepage
            </a>
            
            <a
              href="/patient/appointment"
              className="px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: '#5DC4C7',
                color: '#FFFFFF'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book Another
            </a>
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: '#06434D', opacity: 0.6 }}>
            Need to make changes? Contact us at{' '}
            <a href="mailto:support@healthcare.com" className="font-semibold hover:underline" style={{ color: '#5DC4C7' }}>
              support@healthcare.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}