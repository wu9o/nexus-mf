const PROD_BASE_PATH = 'https://wu9o.github.io/nexus-mf/';
const ROUTER_BASENAME = process.env.NODE_ENV === 'production' ? '/nexus-mf' : '/';

module.exports = {
  PROD_BASE_PATH,
  ROUTER_BASENAME,
};
