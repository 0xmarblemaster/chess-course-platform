'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { WHATSAPP_LEAD_URL, openWhatsAppLead } from '@/lib/whatsapp'
import './landing-chess.css'

// New-tab attributes shared by every WhatsApp CTA.
const WA_LINK = { href: WHATSAPP_LEAD_URL, target: '_blank', rel: 'noopener noreferrer' } as const

// KZ phone mask: +7 (777) 123-45-67
function formatPhone(v: string): string {
  let x = v.replace(/\D/g, '')
  if (!x) return ''
  if (x[0] === '8') x = '7' + x.slice(1)
  if (x[0] !== '7') x = '7' + x
  const p = x.slice(1, 11)
  let s = '+7'
  if (p.length) s += ' (' + p.slice(0, 3)
  if (p.length >= 3) s += ') ' + p.slice(3, 6)
  if (p.length >= 6) s += '-' + p.slice(6, 8)
  if (p.length >= 8) s += '-' + p.slice(8, 10)
  return s
}

export default function Home() {
  const { t } = useLanguage()
  const html = (key: string) => ({ __html: t(`landing.${key}`) })

  // Trial form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [branch, setBranch] = useState('')
  const [time, setTime] = useState('')
  const [status, setStatus] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (!name.trim() || digits.length !== 11 || !branch || !time) {
      setStatus(digits.length !== 11 && name.trim() && branch && time
        ? t('landing.f_phone_err')
        : t('landing.f_err'))
      return
    }
    openWhatsAppLead()
    setStatus(t('landing.f_ok'))
    setName(''); setPhone(''); setBranch(''); setTime('')
  }

  // FAQ: keep one answer open at a time
  const [openFaq, setOpenFaq] = useState(0)
  const faqItems = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']

  const features = [
    { p: '♕︎', k: 'f1' }, { p: '♖︎', k: 'f2' }, { p: '♘︎', k: 'f3' },
    { p: '♗︎', k: 'f4' }, { p: '♔︎', k: 'f5' }, { p: '♙︎', k: 'f6' },
  ]
  const steps = [
    { p: '♙︎', key: 'D', k: 'l1' }, { p: '♘︎', key: 'C', k: 'l2' },
    { p: '♗︎', key: 'B', k: 'l3' }, { p: '♖︎', key: 'A', k: 'l4' },
    { p: '♕︎', key: 'PRO', k: 'l5' },
  ]
  const branches = [
    { n: 'b1', d: 'b1_d' }, { n: 'b2', d: 'b2_d' }, { n: 'b3', d: 'b3_d' },
    { n: 'b4', d: 'b4_d' }, { n: 'b5', d: 'b5_d' }, { n: 'b6', d: 'b6_d' },
  ]
  const trainers = [
    { name: 'Chingis Baurzhanovich', tag: 'b6_short', d: 'tr1_d', initials: 'CB' },
    { name: 'Assylkhan Agbaevich', tag: 'b2', d: 'tr2_d', img: 'trainer-assylkhan.png' },
    { name: 'Nail Ildusovich', tag: 'b2', d: 'tr3_d', initials: 'NI' },
    { name: 'Vasily Mikhaylovich', tag: 'b6_short', d: 'tr4_d', img: 'trainer-vasily.png' },
    { name: 'Aleksandr Olegovich', tag: 'b3', d: 'tr5_d', img: 'trainer-aleksandr.png' },
  ]
  const programs = [
    { p: '♙︎', b: 'D', k: 'p1', lvl: 'l1_t' }, { p: '♘︎', b: 'C', k: 'p2', lvl: 'l2_t' },
    { p: '♗︎', b: 'B', k: 'p3', lvl: 'l3_t' }, { p: '♖︎', b: 'A', k: 'p4', lvl: 'l4_t' },
    { p: '♕︎', b: 'PRO', k: 'p5', lvl: 'l5_t' },
  ]
  const priceFeatures = ['pf_8', 'pf_tour', 'pf_book', 'pf_group']
  const priceFeatures16 = ['pf_16', 'pf_tour', 'pf_book', 'pf_group']
  const basicPrices = [
    { name: 'pc1', price: '29 500 ₸', feats: priceFeatures },
    { name: 'pc2', price: '37 500 ₸', feats: priceFeatures, featured: true },
    { name: 'pc3', price: '45 500 ₸', feats: priceFeatures },
    { name: 'pc4', price: '44 250 ₸', feats: priceFeatures16 },
  ]
  const gpPrices = [
    { name: 'gp1', price: '35 900 ₸' }, { name: 'gp2', price: '43 900 ₸' },
    { name: 'gp3', price: '51 900 ₸' }, { name: 'gp4', price: '53 850 ₸' },
  ]
  const discounts = [
    { pct: '10%', k: 'd1' }, { pct: '20%', k: 'd2' },
    { pct: '25%', k: 'd3', s: 'd3_s' }, { pct: '50%', k: 'd4', s: 'd4_s' },
  ]
  const posts = [
    { no: '1', t: 'a1_t', d: 'a1_d' }, { no: '2', t: 'a2_t', d: 'a2_d' }, { no: '3', t: 'a3_t', d: 'a3_d' },
  ]
  const reviews = [
    { q: 'r1', n: 'r1_n', c: 'r1_c', a: 'АК' },
    { q: 'r2', n: 'r2_n', c: 'r2_c', a: 'СМ' },
    { q: 'r3', n: 'r3_n', c: 'r3_c', a: 'ЕН' },
  ]

  return (
    <div className="chess-classic">
      <main id="main">
        {/* Hero */}
        <section className="hero" id="top">
          <div className="wrap hero-grid">
            <div className="hero-text">
              <p className="eyebrow">{t('landing.ch_move')}</p>
              <h1 dangerouslySetInnerHTML={html('hero_title')} />
              <p className="lead">{t('landing.hero_sub')}</p>
              <a className="btn btn-primary btn-lg" {...WA_LINK}>{t('landing.hero_cta')}</a>
              <ul className="hero-stats">
                <li><strong>800+</strong><span>{t('landing.stat_students')}</span></li>
                <li><strong>10+</strong><span>{t('landing.stat_years')}</span></li>
                <li><strong>2018</strong><span>{t('landing.stat_founded')}</span></li>
              </ul>
            </div>
            <div className="hero-media">
              <img src="/landing-chess/chess-pieces.jpg" alt={t('landing.hero_img_alt')} width={800} height={533} />
            </div>
          </div>
        </section>

        {/* About */}
        <section className="section" id="about">
          <div className="wrap split">
            <figure className="media-frame">
              <img src="/landing-chess/chess-pieces.jpg" alt={t('landing.about_img_alt')} width={800} height={533} loading="lazy" />
            </figure>
            <div className="prose">
              <p className="eyebrow"><span className="glyph" aria-hidden="true">{'♔︎'}</span> {t('landing.ch_about')}</p>
              <h2>{t('landing.about_title')}</h2>
              <p>{t('landing.about_p1')}</p>
              <p>{t('landing.about_p2')}</p>
              <p>{t('landing.about_p3')}</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section" id="features">
          <div className="wrap">
            <header className="section-head">
              <div>
                <p className="eyebrow">{t('landing.ch_features')}</p>
                <h2>{t('landing.features_title')}</h2>
              </div>
              <p>{t('landing.features_sub')}</p>
            </header>
            <div className="features-grid">
              {features.map((f) => (
                <article className="feature" key={f.k}>
                  <span className="feature-mark" aria-hidden="true">{f.p}</span>
                  <h3>{t(`landing.${f.k}_t`)}</h3>
                  <p>{t(`landing.${f.k}_d`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Path */}
        <section className="section" id="path">
          <div className="wrap">
            <header className="section-head is-center">
              <p className="eyebrow">{t('landing.ch_path')}</p>
              <h2>{t('landing.path_title')}</h2>
              <p>{t('landing.path_sub')}</p>
            </header>
            <ol className="path">
              {steps.map((s) => (
                <li className="step" key={s.key}>
                  <span className="step-piece" aria-hidden="true">{s.p}</span>
                  <span className="step-key">{s.key}</span>
                  <h3>{t(`landing.${s.k}_t`)}</h3>
                  <span className="step-rating">{t(`landing.${s.k}_r`)}</span>
                  <p>{t(`landing.${s.k}_d`)}</p>
                </li>
              ))}
            </ol>
            <p className="path-note">{t('landing.path_note')}</p>
          </div>
        </section>

        {/* Branches */}
        <section className="section" id="branches">
          <div className="wrap">
            <header className="section-head">
              <p className="eyebrow">{t('landing.ch_branches')}</p>
              <h2>{t('landing.branches_title')}</h2>
              <p>{t('landing.branches_sub')}</p>
            </header>
            <ul className="branches">
              {branches.map((b, i) => (
                <li className="branch" key={b.n}>
                  <span className="branch-idx">{String(i + 1).padStart(2, '0')}</span>
                  <div className="branch-body">
                    <h3>{t(`landing.${b.n}`)}</h3>
                    <p>{t(`landing.${b.d}`)}</p>
                  </div>
                  <a className="btn btn-ghost" {...WA_LINK}>{t('landing.branch_cta')}</a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Tournaments */}
        <section className="section section-tournaments" id="tournaments">
          <div className="wrap split">
            <div className="prose">
              <p className="eyebrow"><span className="glyph" aria-hidden="true">{'♖︎'}</span> {t('landing.ch_tour')}</p>
              <h2>{t('landing.tour_title')}</h2>
              <p>{t('landing.tour_p1')}</p>
              <p>{t('landing.tour_p2')}</p>
              <p><strong>{t('landing.tour_strong')}</strong></p>
              <ul className="stats">
                <li><span className="stat-num">4</span><span className="stat-label">{t('landing.tour_s1')}</span></li>
                <li><span className="stat-num">5</span><span className="stat-label">{t('landing.tour_s2')}</span></li>
                <li><span className="stat-num">52</span><span className="stat-label">{t('landing.tour_s3')}</span></li>
              </ul>
            </div>
            <figure className="media-frame">
              <img src="/landing-chess/kids-playing-chess.jpg" alt={t('landing.tour_img_alt')} width={1200} height={800} loading="lazy" />
            </figure>
          </div>
        </section>

        {/* Trainers */}
        <section className="section" id="trainers">
          <div className="wrap">
            <header className="section-head">
              <div><h2>{t('landing.trainers_title')}</h2></div>
              <p>{t('landing.trainers_sub')}</p>
            </header>
            <ul className="trainers">
              {trainers.map((tr) => (
                <li className="trainer" key={tr.name}>
                  {tr.img
                    ? <img className="avatar" src={`/landing-chess/${tr.img}`} alt={tr.name} width={240} height={240} loading="lazy" />
                    : <span className="avatar avatar-initials" aria-hidden="true">{tr.initials}</span>}
                  <h3>{tr.name}</h3>
                  <span className="tag">{t(`landing.${tr.tag}`)}</span>
                  <p>{t(`landing.${tr.d}`)}</p>
                </li>
              ))}
            </ul>
            <div className="center">
              <a className="btn btn-primary" {...WA_LINK}>{t('landing.trainers_cta')}</a>
            </div>
          </div>
        </section>

        {/* Programs */}
        <section className="section" id="programs">
          <div className="wrap">
            <header className="section-head is-center">
              <p className="eyebrow">{t('landing.ch_programs')}</p>
              <h2>{t('landing.programs_title')}</h2>
              <p>{t('landing.programs_sub')}</p>
            </header>
            <ol className="programs">
              {programs.map((p) => (
                <li className="program" key={p.b}>
                  <div className="level-badge">
                    <span className="level-piece" aria-hidden="true">{p.p}</span>
                    <span><b>{p.b}</b><small>{t(`landing.${p.lvl}`)}</small></span>
                  </div>
                  <div className="program-title">
                    <h3>{t(`landing.${p.k}_t`)}</h3>
                    <span className="rating">{t(`landing.${p.k}_r`)}</span>
                  </div>
                  <p>{t(`landing.${p.k}_d`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Adults */}
        <section className="section" id="adults">
          <div className="wrap">
            <div className="adults">
              <div className="adults-info">
                <p className="eyebrow"><span className="glyph" aria-hidden="true">{'♚︎'}</span> {t('landing.ch_adults')}</p>
                <h2>{t('landing.adults_title')}</h2>
                <p dangerouslySetInnerHTML={html('adults_p')} />
              </div>
              <div className="adults-card">
                <p className="adults-price"><strong>5&nbsp;000&nbsp;₸</strong> {t('landing.adults_per')}</p>
                <p>{t('landing.adults_trial')}</p>
                <a className="btn btn-primary" {...WA_LINK}>{t('landing.adults_cta')}</a>
              </div>
            </div>
          </div>
        </section>

        {/* Prices */}
        <section className="section" id="prices">
          <div className="wrap">
            <header className="section-head is-center">
              <p className="eyebrow">{t('landing.ch_prices')}</p>
              <h2>{t('landing.prices_title')}</h2>
            </header>
            <div>
              <h3 className="sub-title">{t('landing.prices_basic')}</h3>
              <div className="price-grid">
                {basicPrices.map((c) => (
                  <article className={`price-card${c.featured ? ' is-featured' : ''}`} key={c.name}>
                    <h4 className="price-name">
                      {c.featured && <span className="badge">{t('landing.popular')}</span>}
                      <span dangerouslySetInnerHTML={html(c.name)} />
                    </h4>
                    <p className="price"><strong>{c.price}</strong><span>{t('landing.per_month')}</span></p>
                    <ul className="price-features">
                      {c.feats.map((f) => <li key={f}>{t(`landing.${f}`)}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
              <h3 className="sub-title">{t('landing.prices_gp')}</h3>
              <div className="price-grid">
                {gpPrices.map((c) => (
                  <article className="price-card" key={c.name}>
                    <h4 className="price-name"><span dangerouslySetInnerHTML={html(c.name)} /></h4>
                    <p className="price"><strong>{c.price}</strong><span>{t('landing.per_month')}</span></p>
                  </article>
                ))}
              </div>
              <div className="discounts">
                <h3 className="sub-title">{t('landing.discounts')}</h3>
                <ul className="discount-grid">
                  {discounts.map((d) => (
                    <li key={d.pct}>
                      <span className="pct">{d.pct}</span>
                      <p>{t(`landing.${d.k}`)}{d.s && <><br /><small>{t(`landing.${d.s}`)}</small></>}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Trial */}
        <section className="section section-trial" id="trial">
          <div className="wrap">
            <header className="section-head is-center">
              <h2>{t('landing.trial_title')}</h2>
              <p>{t('landing.trial_sub')}</p>
            </header>
            <form className="trial-form" onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="name">{t('landing.f_name')}</label>
                <input type="text" id="name" name="name" autoComplete="name"
                  placeholder={t('landing.f_name_ph')} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="phone">{t('landing.f_phone')}</label>
                <input type="tel" id="phone" name="phone" autoComplete="tel" inputMode="tel"
                  placeholder="+7 (___) ___-__-__" value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))} />
              </div>
              <div className="field">
                <label htmlFor="branch">{t('landing.f_branch')}</label>
                <select id="branch" name="branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="">{t('landing.f_branch')}</option>
                  <option value="arena">{t('landing.b1')}</option>
                  <option value="debut">{t('landing.b2')}</option>
                  <option value="khalyk">{t('landing.b3')}</option>
                  <option value="almaty1">{t('landing.b4')}</option>
                  <option value="zhandosova">{t('landing.b5')}</option>
                  <option value="gagarin">{t('landing.b6')}</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="time">{t('landing.f_time')}</label>
                <select id="time" name="time" value={time} onChange={(e) => setTime(e.target.value)}>
                  <option value="">{t('landing.f_time_ph')}</option>
                  <option value="morning">{t('landing.t_morning')}</option>
                  <option value="day">{t('landing.t_day')}</option>
                  <option value="evening">{t('landing.t_evening')}</option>
                  <option value="weekend">{t('landing.t_weekend')}</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-block">{t('landing.f_submit')}</button>
              <p className="form-status" role="status" aria-live="polite">{status}</p>
            </form>
          </div>
        </section>

        {/* Blog */}
        <section className="section" id="blog">
          <div className="wrap">
            <header className="section-head is-center">
              <p className="eyebrow">{t('landing.ch_blog')}</p>
              <h2>{t('landing.blog_title')}</h2>
              <p>{t('landing.blog_sub')}</p>
            </header>
            <div className="blog-grid">
              {posts.map((post) => (
                <article className="post" key={post.no}>
                  <span className="post-no">{t('landing.ch_article')} {post.no}</span>
                  <h3>{t(`landing.${post.t}`)}</h3>
                  <p>{t(`landing.${post.d}`)}</p>
                  <a className="read-more" href="#">{t('landing.read_more')} →</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="section" id="reviews">
          <div className="wrap">
            <header className="section-head is-center">
              <h2>{t('landing.reviews_title')}</h2>
              <p>{t('landing.reviews_sub')}</p>
            </header>
            <div className="reviews-grid">
              {reviews.map((r) => (
                <figure className="review" key={r.n}>
                  <blockquote><p>«{t(`landing.${r.q}`)}»</p></blockquote>
                  <figcaption>
                    <span className="avatar-sm" aria-hidden="true">{r.a}</span>
                    <span><strong>{t(`landing.${r.n}`)}</strong><small>{t(`landing.${r.c}`)}</small></span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq">
          <div className="wrap">
            <header className="section-head"><h2>{t('landing.faq_title')}</h2></header>
            <div className="faq">
              {faqItems.map((n, i) => (
                <details className="faq-item" key={n} open={openFaq === i}
                  onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) setOpenFaq(i); else if (openFaq === i) setOpenFaq(-1) }}>
                  <summary><span>{t(`landing.q${n}`)}</span></summary>
                  <div className="faq-a"><p>{t(`landing.a${n}`)}</p></div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contacts */}
        <section className="section" id="contacts">
          <div className="wrap">
            <header className="section-head">
              <h2>{t('landing.contacts_title')}</h2>
              <p>{t('landing.contacts_sub')}</p>
            </header>
            <div className="split contacts-grid">
              <div className="contact-card">
                <h3>{t('landing.contact_us')}</h3>
                <dl className="contact-list">
                  <div><dt>{t('landing.c_phone')}</dt><dd><a href="tel:+77771234567">+7 (777) 123-45-67</a></dd></div>
                  <div><dt>WhatsApp</dt><dd><a {...WA_LINK}>+7 (707) 787-22-10</a></dd></div>
                  <div><dt>Instagram</dt><dd><a href="https://instagram.com/chessempire_almaty" target="_blank" rel="noopener noreferrer">@chessempire_almaty</a></dd></div>
                  <div><dt>{t('landing.c_email')}</dt><dd><a href="mailto:info@chessempire.kz">info@chessempire.kz</a></dd></div>
                  <div><dt>{t('landing.c_hours')}</dt><dd dangerouslySetInnerHTML={html('hours')} /></div>
                </dl>
              </div>
              <div className="map-placeholder" role="img" aria-label={t('landing.map').replace(/<br\s*\/?>/g, ' ')}>
                <p dangerouslySetInnerHTML={html('map')} />
              </div>
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="cta-band">
          <div className="wrap cta-inner">
            <div>
              <p className="eyebrow">{t('landing.ch_cta_eb')}</p>
              <h2>{t('landing.ch_cta')}</h2>
            </div>
            <a className="btn btn-light btn-lg" {...WA_LINK}>{t('landing.hero_cta')}</a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-panel">
            <div className="footer-grid">
              <div className="footer-brand">
                <h3><span className="glyph" aria-hidden="true">{'♔︎'}</span> Chess Empire</h3>
                <p>{t('landing.footer_desc')}</p>
                <ul className="socials">
                  <li><a href="https://instagram.com/chessempire_almaty" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                  <li><a href="#">Facebook</a></li>
                  <li><a href="#">Telegram</a></li>
                  <li><a href="#">YouTube</a></li>
                </ul>
              </div>
              <div>
                <h3>{t('landing.footer_quick')}</h3>
                <ul>
                  <li><a href="#about">{t('landing.nav_about')}</a></li>
                  <li><a href="#programs">{t('landing.footer_programs')}</a></li>
                  <li><a href="#prices">{t('landing.nav_prices')}</a></li>
                  <li><a href="#branches">{t('landing.nav_branches')}</a></li>
                  <li><a href="#faq">{t('landing.nav_faq')}</a></li>
                </ul>
              </div>
              <div>
                <h3>{t('landing.footer_branches_title')}</h3>
                <ul>
                  <li><a href="#branches">{t('landing.b1')}</a></li>
                  <li><a href="#branches">{t('landing.b2')}</a></li>
                  <li><a href="#branches">{t('landing.b3')}</a></li>
                  <li><a href="#branches">{t('landing.b4')}</a></li>
                  <li><a href="#branches">{t('landing.b5')}</a></li>
                  <li><a href="#branches">{t('landing.b6_short')}</a></li>
                </ul>
              </div>
              <div>
                <h3>{t('landing.footer_contacts')}</h3>
                <p><a href="tel:+77771234567">+7 (777) 123-45-67</a></p>
                <p><a href="mailto:info@chessempire.kz">info@chessempire.kz</a></p>
                <p>{t('landing.footer_6')}</p>
              </div>
            </div>
            <div className="footer-bottom">
              <p>{t('landing.copyright')}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
