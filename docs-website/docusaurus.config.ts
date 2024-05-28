import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Persist',
  tagline: '',
  favicon: 'img/logos/favicon.svg',

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/persist/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'facebook', // Usually your GitHub org/user name.
  projectName: 'docusaurus', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      // title: 'Persist',
      logo: {
        alt: 'Persist Logo',
        src: 'img/logos/persist-logo-small-light.svg',
        srcDark:'img/logos/persist-logo-small-dark.svg',
        href:'/'
      },
      items: [
        {to: '/about', label: 'About', position: 'left'},
        {to: '/community', label: 'Community', position: 'left'},
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/visdesignlab/persist',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style:'light',
      links: [
        {
          html:` 
            <div class="footer-wrapper row">
              <a class="col col--3" target="_blank" href="https://vdl.sci.utah.edu/">
                <img src="/img/logos/vdl-logo-light.svg" class='logo light-theme-display-component'/>
                <img src="/img/logos/vdl-logo-dark.svg" class='logo dark-theme-display-component'/>
              </a>
              <a class="col col--3" target="_blank" href="https://www.sci.utah.edu/">
                <img src="/img/logos/sci-logo-light.svg" class='logo light-theme-display-component'/>
                <img src="/img/logos/sci-logo-dark.svg" class='logo dark-theme-display-component'/>
              </a>
              <a class="col col--3" target="_blank" href="https://www.cs.utah.edu/">
                <img src="/img/logos/ULogo-light.svg" class='logo light-theme-display-component'/>
                <img src="/img/logos/ULogo-dark.svg" class='logo dark-theme-display-component'/>
              </a>
              <a class="col col--3" target="_blank" href="https://www.nsf.gov/">
                <img src="/img/logos/nsf.png" class='logo'/>
              </a>                                                       
            </div>
          `
        },
      ],
      copyright: `Copyright © 2022-${new Date().getFullYear()}. The Persist team. Last updated on ${new Date().toISOString().split('T')[0]}. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
