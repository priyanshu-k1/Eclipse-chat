import React from 'react'
import './LegalitiesModal.css'


const LegalitiesModal = ({ isOpen, type }) => {

    if (!isOpen) return null;
    return (
        <div className='legalities-modal'>
            <div className="legalities-header">
                {type === 'terms' && <h2>Terms of Service</h2>}
                {type === 'privacy' && <h2>Privacy Policy</h2>}
            </div>
            <div className="legalities-content">
                {type === 'terms' && (
                    <div className="textContent">
                        <h3>Eclipse Chat - Terms of Service</h3>
                        <p>Welcome to Eclipse Chat (“Eclipse,” “we,” “our,” or “us”). These Terms of Service (“Terms”) govern your access to and use of our website, mobile applications, and related services (collectively, the “Service”). By creating an account, downloading, or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>
                        <ol>
                            <li>
                                <strong>Eligibility</strong>
                                <p>You must:
                                    <ul>
                                        <li>Be at least 16 years old (or the minimum legal age in your jurisdiction).</li>
                                        <li>Have the legal authority to accept these Terms.</li>
                                        <li>Not be prohibited from using the Service under applicable laws.</li>
                                    </ul>
                                </p>
                            </li>
                            <li>
                                <strong>Account & Security</strong>
                                <p>
                                    <ul>
                                        <li><strong>Account Creation:</strong> You must provide accurate, complete information during registration.</li>
                                        <li><strong>Security:</strong> You are responsible for safeguarding your login credentials. Notify us immediately of unauthorized use.</li>
                                        <li><strong>One Account Rule:</strong> You may only create one account per user, unless explicitly authorized.</li>
                                    </ul>
                                </p>
                            </li>
                            <li>
                                <strong>Privacy & Data Protection</strong>
                                <p>
                                    <ul>
                                        <li><strong>End-to-End Encryption:</strong> Messages are encrypted by default; we cannot access your private conversations.</li>
                                        <li><strong>Ephemeral Messaging:</strong> Messages may disappear after viewing unless both parties choose to save them.</li>
                                        <li><strong>No Ads or Tracking:</strong> We do not sell your data or use third-party ads.</li>
                                        <li><strong>Consent-Driven:</strong> Saving, sharing, or connecting actions require approval from both users.</li>
                                    </ul>
                                    For more details, see our [Privacy Policy].
                                </p>
                            </li>
                            <li>
                                <strong>User Responsibilities</strong>
                                <p>You agree not to:
                                    <ul>
                                        <li>Use the Service for illegal, harmful, or abusive activities, including harassment, hate speech, or fraud.</li>
                                        <li>Upload or share content that is unlawful, offensive, or violates intellectual property rights.</li>
                                        <li>Interfere with, disrupt, or attempt to gain unauthorized access to the Service.</li>
                                        <li>Circumvent security features (e.g., screenshot protection, anti-snooping measures).</li>
                                    </ul>
                                    We reserve the right to suspend or terminate accounts that violate these Terms.
                                </p>
                            </li>
                            <li>
                                <strong>Intellectual Property</strong>
                                <p>
                                    <ul>
                                        <li><strong>Our Rights:</strong> The Eclipse Chat name, logo, design elements, software, and features are owned by Eclipse and protected by copyright, trademark, and other laws.</li>
                                        <li><strong>Your Rights:</strong> You retain ownership of content you send but grant Eclipse a limited, non-exclusive license to store, transmit, and display it as necessary for operating the Service.</li>
                                    </ul>
                                </p>
                            </li>
                            <li>
                                <strong>Ephemeral & Saved Content</strong>
                                <p>
                                    <ul>
                                        <li>By default, messages are temporary and auto-delete after viewing.</li>
                                        <li>If both users agree, a message may be saved. Saved content remains your responsibility, and you are liable for any use of it outside the app.</li>
                                    </ul>
                                    Eclipse is not responsible for how other users handle content you share.
                                </p>
                            </li>
                            <li>
                                <strong>Service Availability & Updates</strong>
                                <p>
                                    <ul>
                                        <li>We strive to maintain reliable, secure services, but downtime may occur.</li>
                                        <li>We may update, modify, or discontinue parts of the Service at any time without prior notice.</li>
                                    </ul>
                                    Features such as stealth mode and ephemeral messaging are subject to continuous improvement.
                                </p>
                            </li>
                            <li>
                                <strong>Termination</strong>
                                <p>We may suspend or terminate your access if you:
                                    <ul>
                                        <li>Violate these Terms or applicable laws.</li>
                                        <li>Use the Service in a way that risks harm to other users, the community, or Eclipse.</li>
                                    </ul>
                                    You may delete your account at any time in-app. Upon termination, your right to use the Service ends immediately.
                                </p>
                            </li>
                            <li>
                                <strong>Disclaimers & Limitations</strong>
                                <p>
                                    <ul>
                                        <li><strong>No Warranty:</strong> The Service is provided “as is” and “as available.” We disclaim all warranties, express or implied.</li>
                                        <li><strong>Limitation of Liability:</strong> To the fullest extent permitted by law, Eclipse is not liable for indirect, incidental, or consequential damages, including loss of data, reputation, or profits.</li>
                                    </ul>
                                </p>
                            </li>
                            <li>
                                <strong>Governing Law</strong>
                                <p>These Terms are governed by the laws of India, without regard to conflict of laws principles. Any disputes will be resolved exclusively in the courts of India.</p>
                            </li>
                            <li>
                                <strong>Changes to Terms</strong>
                                <p>We may update these Terms from time to time. The latest version will always be available in the app and on our website. Continued use after changes constitutes acceptance of the revised Terms.</p>
                            </li>
                        </ol>
                    </div>
                )}
                {type === 'privacy' && (
                    <div className="textContent">
                        <h3>Eclipse Chat - Privacy Policy</h3>
                        <p>Eclipse Chat (“Eclipse,” “we,” “our,” or “us”) values your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our website, mobile applications, and services (collectively, the “Service”).</p>
                        <p>By using the Service, you agree to this Policy. If you do not agree, please do not use Eclipse Chat.</p>
                        <ol>
                            <li>
                                <strong>Our Privacy Commitment</strong>
                                <p>
                                    <ul>
                                        <li><strong>No Ads. No Tracking.</strong> We do not sell your data or show you targeted ads.</li>
                                        <li><strong>Ephemeral by Default.</strong> Messages vanish unless both users choose to save.</li>
                                        <li><strong>End-to-End Encryption.</strong> Only you and your contacts can read your messages—not Eclipse.</li>
                                        <li><strong>Consent-Driven.</strong> Any saving, sharing, or connection requires approval from both sides.</li>
                                    </ul>
                                </p>
                            </li>
                            <li>
                                <strong>Information We Collect</strong>
                                <p>We collect the minimum data necessary to provide the Service:
                                    <ul>
                                        <li><strong>Account Information:</strong> Username, display name, avatar (optional), and password (encrypted).</li>
                                        <li><strong>Identifiers:</strong> A unique ID generated for your account.</li>
                                        <li><strong>Messages & Media:</strong> Encrypted in transit and at rest. By default, they are deleted once delivered and viewed, unless both users save them.</li>
                                        <li><strong>Device Information:</strong> Basic technical data (e.g., browser type, app version, OS) to ensure compatibility.</li>
                                        <li><strong>Connection Data:</strong> Information about friend requests, connections, and consent choices.</li>
                                    </ul>
                                    We do not collect phone numbers, contact lists, GPS location, or other sensitive data.
                                </p>
                            </li>
                            <li>
                                <strong>How We Use Your Information</strong>
                                <p>We use your data strictly to:
                                    <ul>
                                        <li>Provide and improve the Service.</li>
                                        <li>Ensure security, prevent fraud, and maintain trust.</li>
                                        <li>Sync your messages and settings across devices (ephemeral unless saved).</li>
                                        <li>Notify you of connection requests, new messages, or updates.</li>
                                    </ul>
                                </p>
                            </li>
                            <li>
                                <strong>Sharing of Information</strong>
                                <p>We do not sell, rent, or trade your information. We only share data:
                                    <ul>
                                        <li><strong>With Your Consent:</strong> If you explicitly allow saving/sharing.</li>
                                        <li><strong>For Security/Legal Reasons:</strong> To comply with valid legal requests, protect our users, or enforce our Terms of Service.</li>
                                        <li><strong>With Service Providers:</strong> Limited trusted providers who support infrastructure, bound by confidentiality agreements.</li>
                                    </ul>
                                </p>
                            </li>
                            <li>
                                <strong>Data Retention & Deletion</strong>
                                <p>
                                    <ul>
                                        <li><strong>Messages:</strong> Deleted automatically after delivery and reading, unless both users save them.</li>
                                        <li><strong>Saved Content:</strong> Retained only until you or your contact choose to delete it.</li>
                                        <li><strong>Account Data:</strong> Retained while your account is active. You can request deletion anytime.</li>
                                    </ul>
                                    When you delete your account, all associated data (messages, connections, identifiers) are erased permanently.
                                </p>
                            </li>
                            <li>
                                <strong>Your Rights</strong>
                                <p>Depending on your jurisdiction (e.g., GDPR, CCPA), you may have the right to:
                                    <ul>
                                        <li>Access and download your personal data.</li>
                                        <li>Request correction or deletion of data.</li>
                                        <li>Restrict or object to certain processing.</li>
                                        <li>Withdraw consent at any time.</li>
                                    </ul>
                                </p>
                            </li>
                            <li>
                                <strong>Security Measures</strong>
                                <p>
                                    <ul>
                                        <li>End-to-end encryption for messages.</li>
                                        <li>Encrypted password storage (bcrypt).</li>
                                        <li>Anti-screenshot and stealth features for added privacy.</li>
                                        <li>Regular audits and security updates.</li>
                                    </ul>
                                    No system is 100% secure, but we design Eclipse with privacy and safety at the core.
                                </p>
                            </li>
                            <li>
                                <strong>Children’s Privacy</strong>
                                <p>Eclipse is not directed to children under 16 years old. If we learn that we have collected personal data from a child without parental consent, we will delete it immediately.</p>
                            </li>
                            <li>
                                <strong>International Users</strong>
                                <p>Your data may be processed and stored in locations outside your country of residence. We ensure adequate safeguards are in place to protect your data across jurisdictions.</p>
                            </li>
                            <li>
                                <strong>Updates to this Policy</strong>
                                <p>We may update this Privacy Policy occasionally to reflect changes in features, legal requirements, or user feedback. The latest version will always be posted in the app.</p>
                            </li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LegalitiesModal