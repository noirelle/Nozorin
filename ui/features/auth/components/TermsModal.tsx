'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAgree: () => void;
}

export const TermsModal = ({ isOpen, onClose, onAgree }: TermsModalProps) => {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Reset scroll state when modal opens
    useEffect(() => {
        if (isOpen) {
            setHasScrolledToBottom(false);
            if (scrollRef.current) {
                scrollRef.current.scrollTop = 0;
            }
        }
    }, [isOpen]);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;

        const threshold = 40;
        const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

        if (isAtBottom) {
            setHasScrolledToBottom(true);
        }
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-black/10 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#fce7f3] shrink-0">
                    <h2 className="text-[18px] font-bold text-[#1c1e21]">Terms of Service & Privacy Policy</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-6 py-5 text-[13.5px] text-gray-600 leading-relaxed space-y-6"
                >
                    {/* Terms of Service */}
                    <section>
                        <h3 className="text-[15px] font-bold text-[#1c1e21] mb-3">Terms of Service</h3>
                        <p className="mb-3">
                            <strong>Last Updated:</strong> March 1, 2026
                        </p>
                        <p className="mb-3">
                            Welcome to Nozorin. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully before using our services.
                        </p>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">1. Eligibility</h4>
                        <p className="mb-3">
                            You must be at least 18 years of age to use Nozorin. By creating an account or using our services, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these terms.
                        </p>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">2. Acceptable Use</h4>
                        <p className="mb-3">
                            When using Nozorin, you agree not to:
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5 mb-3">
                            <li>Harass, bully, threaten, or intimidate other users</li>
                            <li>Share explicit, violent, or illegal content</li>
                            <li>Impersonate another person or misrepresent your identity</li>
                            <li>Use automated tools, bots, or scripts to access the service</li>
                            <li>Attempt to gain unauthorized access to other accounts or systems</li>
                            <li>Engage in any activity that violates applicable laws or regulations</li>
                        </ul>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">3. User Content</h4>
                        <p className="mb-3">
                            You retain ownership of content you share on Nozorin. However, by using our platform, you grant us a non-exclusive, worldwide license to use, display, and distribute your content solely for providing and improving the service.
                        </p>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">4. Account Suspension</h4>
                        <p className="mb-3">
                            We reserve the right to suspend or terminate your access to Nozorin at any time, without prior notice, for conduct that we believe violates these Terms of Service, is harmful to other users, or is otherwise objectionable.
                        </p>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">5. Disclaimer of Warranties</h4>
                        <p className="mb-3">
                            Nozorin is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
                        </p>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">6. Limitation of Liability</h4>
                        <p className="mb-3">
                            To the maximum extent permitted by law, Nozorin and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
                        </p>
                    </section>

                    {/* Divider */}
                    <div className="h-px bg-[#fce7f3]" />

                    {/* Privacy Policy */}
                    <section>
                        <h3 className="text-[15px] font-bold text-[#1c1e21] mb-3">Privacy Policy</h3>
                        <p className="mb-3">
                            <strong>Last Updated:</strong> March 1, 2026
                        </p>
                        <p className="mb-3">
                            Your privacy is important to us. This Privacy Policy explains how Nozorin collects, uses, and protects your personal information when you use our services.
                        </p>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">1. Information We Collect</h4>
                        <p className="mb-2">We may collect the following types of information:</p>
                        <ul className="list-disc pl-5 space-y-1.5 mb-3">
                            <li><strong>Guest Sessions:</strong> A unique session identifier is generated for each guest user. No personal information is required.</li>
                            <li><strong>Gender Selection:</strong> The gender you provide during onboarding is used solely for matchmaking purposes.</li>
                            <li><strong>Device Information:</strong> Browser type, operating system, and device fingerprint for security and fraud prevention.</li>
                            <li><strong>Usage Data:</strong> Interaction patterns, session duration, and feature usage for improving the service.</li>
                            <li><strong>IP Address:</strong> Used for regional matching, abuse prevention, and legal compliance.</li>
                        </ul>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">2. How We Use Your Information</h4>
                        <ul className="list-disc pl-5 space-y-1.5 mb-3">
                            <li>To provide and maintain the Nozorin service</li>
                            <li>To match you with other users based on your preferences</li>
                            <li>To detect and prevent abuse, fraud, and violations of our terms</li>
                            <li>To analyze usage patterns and improve the platform</li>
                            <li>To comply with legal obligations</li>
                        </ul>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">3. Data Retention</h4>
                        <p className="mb-3">
                            Guest session data is automatically deleted after 7 days of inactivity. We do not store chat messages, voice conversations, or video streams on our servers. All communications are peer-to-peer and ephemeral.
                        </p>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">4. Data Sharing</h4>
                        <p className="mb-3">
                            We do not sell, trade, or rent your personal information to third parties. We may share anonymized, aggregated data for analytical purposes. We may disclose information if required by law or to protect the safety of our users.
                        </p>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">5. Cookies & Tracking</h4>
                        <p className="mb-3">
                            Nozorin uses essential cookies to maintain your session and preferences. We do not use third-party advertising cookies or tracking pixels.
                        </p>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">6. Your Rights</h4>
                        <p className="mb-3">
                            You have the right to request access to, correction of, or deletion of your personal data. Since guest sessions are anonymous and ephemeral, most data is automatically purged. For any requests, contact us at privacy@nozorin.com.
                        </p>

                        <h4 className="font-semibold text-[#1c1e21] mt-4 mb-2">7. Contact Us</h4>
                        <p>
                            If you have questions about this Privacy Policy, please contact us at <span className="text-[#ec4899] font-medium">privacy@nozorin.com</span>.
                        </p>
                    </section>

                    {/* Scroll indicator */}
                    {!hasScrolledToBottom && (
                        <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-2 flex justify-center pointer-events-none">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300 animate-bounce pointer-events-none">
                                ↓ Scroll to continue ↓
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer / Action */}
                <div className="px-6 py-4 border-t border-[#fce7f3] shrink-0">
                    <button
                        onClick={onAgree}
                        disabled={!hasScrolledToBottom}
                        className="w-full h-[44px] rounded-full bg-[#ec4899] hover:bg-[#db2777] text-white font-bold text-[15px] transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {hasScrolledToBottom ? 'I Agree' : 'Read to continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};
