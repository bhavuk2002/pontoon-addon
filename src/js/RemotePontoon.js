function RemotePontoon(team) {
    this._baseUrl = 'https://pontoon.mozilla.org';
    this._notificationsUrl = this._baseUrl + '/notifications/';
    this._markAsReadUrl = this._notificationsUrl + 'mark-all-as-read/';
    this._team = team;
    this._listenToMessagesFromContent();
    this._watchOptionsUpdates();
}

RemotePontoon.prototype = {
    getBaseUrl: function() {
        return this._baseUrl;
    },

    getNotificationsUrl: function() {
        return this._notificationsUrl;
    },

    getMachineryUrl: function() {
        return `${this._baseUrl}/machinery/`;
    },

    getTeamPageUrl: function() {
        return `${this._baseUrl}/${this._team}/`;
    },

    getTeamBugsUrl: function() {
        return `${this._baseUrl}/${this._team}/bugs/`;
    },

    getTeamProjectUrl: function(projectsUrl) {
        return this._baseUrl + projectsUrl.replace('/projects/', `/${this._team}/`);
    },

    getSearchUrlForSelectedTextOnMozillaOrg: function(selectedText) {
        return `${this._baseUrl}/${this._team}/mozillaorg/all-resources/?search=${selectedText.replace(' ', '+')}`;
    },

    updateNotificationsDocText: function() {
        fetch(this.getNotificationsUrl(), {
            credentials: 'include',
            redirect: 'manual',
        }).then(function(response) {
            if (response.status == 200) {
                return response.text();
            } else {
                return undefined;
            }
        }.bind(this)).then(function(text) {
            if (text != undefined) {
                chrome.storage.local.set({notificationsDocText: text});
            } else {
                chrome.storage.local.set({notificationsDocText: undefined});
            }
        }.bind(this));
    },

    _listenToMessagesFromContent: function() {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            switch (request.type) {
                case 'pontoon-page-loaded':
                    chrome.storage.local.set({notificationsDocText: request.value});
                    break;
                case 'mark-all-notifications-as-read-from-page':
                    this.markAllNotificationsAsRead();
                    break;
            }
        }.bind(this));
    },

    _watchOptionsUpdates: function() {
        chrome.storage.onChanged.addListener(function(changes, areaName) {
            if (changes['options.locale_team'] !== undefined) {
                this._team = changes['options.locale_team'].newValue;
            }
        }.bind(this));
    },

    _triggerNotificationsReload: function() {
        chrome.runtime.sendMessage({type: 'notifications-reload-request'});
    },

    markAllNotificationsAsRead: function() {
        browser.tabs.query({
            url: this.getBaseUrl() + '/*',
        }).then(function(pontoonTabs) {
            for (const tab of pontoonTabs) {
                chrome.tabs.sendMessage(tab.id, {type: 'mark-all-notifications-as-read-from-extension'});
            }
        }.bind(this));

        var request = new XMLHttpRequest();
        request.addEventListener('readystatechange', function (e) {
            if(request.readyState === XMLHttpRequest.DONE) {
                 this._triggerNotificationsReload();
            }
        }.bind(this));
        request.open('GET', this._markAsReadUrl, true);
        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        request.send(null);
    },
}
