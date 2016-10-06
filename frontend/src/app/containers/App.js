/* global ga */
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { push as routerPush } from 'react-router-redux';

import cookies from 'js-cookie';
import Clipboard from 'clipboard';

import { getInstalled, isExperimentEnabled } from '../reducers/addon';
import { getExperimentBySlug } from '../reducers/experiments';
import experimentSelector from '../selectors/experiment';
import { uninstallAddon, installAddon, enableExperiment, disableExperiment } from '../lib/addon';
import addonActions from '../actions/addon';

import Restart from '../components/Restart';

const clipboard = new Clipboard('button');

class App extends Component {
  render() {
    const { restart } = this.props.addon;
    if (restart.isRequired) {
      return <Restart experimentTitle={ restart.forExperiment } {...this.props}/>;
    }
    return React.cloneElement(this.props.children, this.props);
  }
}

function sendToGA(type, dataIn) {
  const data = dataIn || {};
  const hitCallback = () => {
    if (data.outboundURL) {
      document.location = data.outboundURL;
    }
  };
  if (window.ga && ga.loaded) {
    data.hitType = type;
    data.hitCallback = hitCallback;
    ga('send', data);
  } else {
    hitCallback();
  }
}

function subscribeToBasket(email, callback) {
  const url = 'https://basket.mozilla.org/news/subscribe/';
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `newsletters=test-pilot&email=${encodeURIComponent(email)}`
  }).then(callback)
  .catch(err => {
    // for now, log the error in the console & do nothing in the UI
    console && console.error(err); // eslint-disable-line no-console
  });
}

export default connect(
  state => ({
    addon: state.addon,
    experiments: experimentSelector(state),
    isFirefox: state.browser.isFirefox,
    isMinFirefox: state.browser.isMinFirefox,
    isDev: state.browser.isDev,
    hasAddon: state.addon.hasAddon,
    installed: getInstalled(state.addon),
    installedAddons: state.addon.installedAddons,
    getExperimentBySlug: slug =>
      getExperimentBySlug(state.experiments, slug),
    isExperimentEnabled: experiment =>
      isExperimentEnabled(state.addon, experiment)
  }),
  dispatch => ({
    navigateTo: path => dispatch(routerPush(path)),
    enableExperiment: experiment => enableExperiment(dispatch, experiment),
    disableExperiment: experiment => disableExperiment(dispatch, experiment),
    requireRestart: experimentTitle =>
      dispatch(addonActions.requireRestart(experimentTitle))
  }),
  (stateProps, dispatchProps, ownProps) => Object.assign({
    installAddon,
    uninstallAddon,
    sendToGA,
    subscribeToBasket,
    clipboard,
    userAgent: navigator.userAgent,
    openWindow: (href, name) => window.open(href, name),
    getWindowLocation: () => window.location,
    addScrollListener: listener =>
      window.addEventListener('scroll', listener),
    removeScrollListener: listener =>
      window.removeEventListener('scroll', listener),
    getScrollY: () => window.pageYOffset || document.documentElement.scrollTop,
    setScrollY: pos => window.scrollTo(0, pos),
    getElementY: sel => {
      const el = document.querySelector(sel);
      return el ? el.offsetTop : 0;
    },
    getCookie: name => cookies.get(name),
    removeCookie: name => cookies.remove(name),
    setNavigatorTestpilotAddon: value => window.navigator.testpilotAddon = value
  }, ownProps, stateProps, dispatchProps)
)(App);
