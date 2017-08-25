var notificationsUrl = 'https://pontoon.mozilla.org/notifications/';
var refreshInterval;

function updateIconUnreadCount(count) {
  chrome.browserAction.setBadgeText({text: count.toString()});
  if (count > 0) {
    chrome.browserAction.setBadgeBackgroundColor({color: '#F36'});
  } else {
    chrome.browserAction.setBadgeBackgroundColor({color: '#4d5967'});
  }
}

function updateNumberOfUnreadNotifications() {
  fetch(notificationsUrl, {
    credentials: 'include'
  }).then(function(response) {
    return response.text();
  }).then(function(text) {
    chrome.storage.local.set({notificationsDocText: text});
    var notificationsDoc = new DOMParser().parseFromString(text, 'text/html');
    var unreadCount = notificationsDoc.querySelectorAll('#main .notification-item[data-unread=true]').length;
    updateIconUnreadCount(unreadCount);
  });
}

function scheduleRefresh(intervalTime) {
  clearInterval(refreshInterval);
  refreshInterval = setInterval(updateNumberOfUnreadNotifications, intervalTime);
}

function openNotificationsPage() {
  chrome.tabs.create({url: notificationsUrl});
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  updateNumberOfUnreadNotifications();
});

chrome.browserAction.onClicked.addListener(function() {
  openNotificationsPage();
});
updateNumberOfUnreadNotifications();
scheduleRefresh(5 * 60 * 1000); // 5 minutes

