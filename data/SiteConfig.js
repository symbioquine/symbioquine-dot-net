const config = {
  siteTitle: 'Symbioquine', // Site title.
  siteTitleShort: 'Symbioquine', // Short site title for homescreen (PWA). Preferably should be under 12 characters to prevent truncation.
  siteTitleAlt: 'Symbioquine', // Alternative site title for SEO.
  siteLogo: '/logos/logo-1024.png', // Logo used for SEO and manifest.
  siteUrl: 'https://symbioquine.net', // Domain of your website without pathPrefix.
  pathPrefix: '',
  siteDescription:
    'Here is written stuff about systems, technology, ecology, and more.',
  siteRss: '/rss.xml', // Path to the RSS file.
  googleAnalyticsID: 'G-SNBGXD1Z3E', // GA tracking ID.
  dateFromFormat: 'YYYY-MM-DD', // Date format used in the frontmatter.
  dateFormat: 'YYYY/MM/DD', // Date format for display.
  userName: 'Symbioquine', // Username to display in the author segment.
  userEmail: 'symbioquine@gmail.com', // Email used for RSS feed's author segment
  userTwitter: 'Symbioquine', // Optionally renders "Follow Me" in the Bio segment.
  userGitHub: 'symbioquine', // Optionally renders "Follow Me" in the Bio segment.
  userLocation: 'WA, USA', // User location to display in the author segment.
  copyright: 'Copyright © 2022. All rights reserved.', // Copyright string for the footer of the website and RSS feed.
  themeColor: '#c62828', // Used for setting manifest and progress theme colors.
  backgroundColor: 'red' // Used for setting manifest background color.
}

module.exports = config
