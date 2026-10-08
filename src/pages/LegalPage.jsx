import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';

const PAGES = {
  terms: {
    eyebrow: 'Terms of Service',
    title: 'Starvis Terms of Service',
    updated: 'Effective May 28, 2026',
    intro: 'These terms explain the basic rules for using Starvis as a reputation automation workspace for local businesses.',
    sections: [
      {
        title: 'Using Starvis',
        body: [
          'Starvis helps businesses collect customer feedback, send review request workflows, manage QR review flows, and monitor reputation activity.',
          'You are responsible for keeping account access secure and for making sure your team uses Starvis only for lawful business purposes.',
        ],
      },
      {
        title: 'Customer consent and SMS compliance',
        body: [
          'You are responsible for having proper consent before sending SMS messages to customers.',
          'Message and data rates may apply. Customers may contact you directly to opt out or request support related to communications sent by your business.',
        ],
      },
      {
        title: 'Billing and subscriptions',
        body: [
          'Paid plans renew automatically unless canceled before the next billing period.',
          'Stripe securely processes checkout and billing. Starvis does not store full card numbers in the app.',
        ],
      },
      {
        title: 'Service availability',
        body: [
          'We work to keep Starvis fast and reliable, but third-party services such as Firebase, Stripe, Twilio, Google, and hosting providers may affect availability.',
          'Starvis does not guarantee a specific number of reviews or ratings. Results depend on customer behavior and your business practices.',
        ],
      },
    ],
  },
  privacy: {
    eyebrow: 'Privacy Policy',
    title: 'Starvis Privacy Policy',
    updated: 'Effective May 28, 2026',
    intro: 'This policy explains what Starvis collects and how that data is used to operate your review automation workspace.',
    sections: [
      {
        title: 'Information we collect',
        body: [
          'We collect account information, business profile details, billing selection metadata, customer contact details you enter, review workflow records, and product usage data needed to run the service.',
          'Payment details are handled by Stripe. SMS delivery is handled through the configured Twilio backend.',
        ],
      },
      {
        title: 'How information is used',
        body: [
          'We use data to authenticate users, operate dashboards, send review requests, process billing status, improve product reliability, and provide support.',
          'We do not sell customer contact lists.',
        ],
      },
      {
        title: 'Data security',
        body: [
          'Starvis uses Firebase Authentication, Firestore access controls, secure backend endpoints, and environment-based secrets to protect sensitive operations.',
          'Businesses are responsible for using strong account credentials and limiting access to authorized team members.',
        ],
      },
      {
        title: 'Data requests',
        body: [
          'You may request help updating or deleting business data associated with your workspace, subject to operational, legal, and billing record requirements.',
        ],
      },
    ],
  },
  refund: {
    eyebrow: 'Refund & Cancellation Policy',
    title: 'Refund and Cancellation Policy',
    updated: 'Effective May 28, 2026',
    intro: 'We keep cancellation simple and transparent so businesses can evaluate Starvis with confidence.',
    sections: [
      {
        title: 'Free trial',
        body: [
          'Starvis includes a 14-day free trial.',
          'Users may cancel anytime during the trial.',
          'No charges should occur if the subscription is canceled before the trial ends.',
        ],
      },
      {
        title: 'Paid subscriptions',
        body: [
          'Subscriptions renew automatically unless canceled.',
          'Cancellation takes effect at the end of the current billing cycle.',
          'Cancellation requests are accepted within 10 days after subscription activation.',
          'No partial refunds are provided unless legally required.',
        ],
      },
      {
        title: 'SMS disclaimer',
        body: [
          'Message and data rates may apply to SMS communications.',
          'Businesses are responsible for consent compliance, opt-out handling, and lawful customer communications.',
        ],
      },
      {
        title: 'How cancellation works',
        body: [
          'Canceling a subscription does not immediately delete access. The workspace remains available until the trial or paid billing period ends.',
          'Stripe securely handles billing updates and checkout.',
        ],
      },
    ],
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Contact Starvis',
    updated: 'Pre-launch support',
    intro: 'Questions about Starvis, billing, SMS delivery, or your review workflow can be sent to our support team.',
    sections: [
      {
        title: 'Product and billing help',
        body: [
          'For account, billing, or workspace questions, email the Starvis team at contact@alioapp.fr.',
          'If you are testing SMS delivery, include your business name, customer status, and whether the number is verified in Twilio.',
        ],
      },
      {
        title: 'SMS compliance questions',
        body: [
          'Businesses are responsible for customer consent before sending SMS review requests.',
          'Message and data rates may apply. Reply STOP to opt out.',
        ],
      },
      {
        title: 'Company',
        body: [
          'Starvis is a product published and operated by Alio.',
          'Support email: contact@alioapp.fr',
        ],
      },
    ],
  },
};

export default function LegalPage({ type }) {
  const page = PAGES[type] || PAGES.terms;

  return (
    <div className="min-h-screen bg-[#081120] text-white">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_30%_0%,rgba(30,167,255,0.24),transparent_34%),radial-gradient(circle_at_70%_10%,rgba(123,77,255,0.22),transparent_32%)]" />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
        <BrandLogo to="/" size="md" dark />
        <Link to="/" className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-sky-300 hover:text-white">
          Back to Starvis
        </Link>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 pb-20 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-10"
        >
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">{page.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{page.title}</h1>
          <p className="mt-3 text-sm font-semibold text-slate-400">{page.updated}</p>
          <p className="mt-6 text-lg leading-8 text-slate-300">{page.intro}</p>

          <div className="mt-10 flex flex-col gap-5">
            {page.sections.map(section => (
              <section key={section.title} className="rounded-2xl border border-white/10 bg-[#0B1020]/70 p-5">
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
                <div className="mt-4 flex flex-col gap-3 text-sm leading-6 text-slate-300">
                  {section.body.map(item => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-5 text-sm leading-6 text-sky-100">
            Starvis is published and operated by Alio. Contact: contact@alioapp.fr. These pages are written for clarity and product transparency and should be reviewed by legal counsel before large-scale public promotion.
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
