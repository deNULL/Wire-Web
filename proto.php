<?
  if (!$_SERVER['HTTPS']) {
    header('Location: https://dcpu.ru/mtproto/proto.php');
  }
?><!doctype html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>MTProto Test</title>

  <script src="socket.io/socket.io.js"></script><!-- TODO: implement binary sockets (http://www.html5rocks.com/en/tutorials/webgl/typed_arrays/) -->

  <script src="closure-library/closure/goog/base.js"></script>
  <script type="text/javascript">
    goog.require('goog.math.Long');
  </script>

  <script src="BigInt.js"></script>

  <!--script src="typedarray.js"></script-->

  <script src="//crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha1.js"></script>
  <script src="//crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes.js"></script>
  <script src="//crypto-js.googlecode.com/svn/tags/3.1.2/build/components/enc-utf16-min.js"></script>

  <script src="rawinflate.js"></script><!-- TODO: rewrite this library, it's terrible-looking -->

  <script src="//api-maps.yandex.ru/2.0-stable/?load=package.standard&lang=ru-RU" type="text/javascript"></script>

  <script src="utils.js"></script>
  <script src="tl.js"></script>
  <script src="mtproto.tlscheme.js"></script>
  <script src="api.tlscheme.js"></script>
  <script src="mtproto.js"></script>

  <style>
    html, body, #content, #page_dialogs {
      height: 100%;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #eee;
    }
    body, input, button {
      font-family: Verdana, sans-serif;
      font-size: 14px;
    }
    input {
      height: 20px;
    }
    button {
      height: 26px;
    }
    #content > div {
      display: none;
    }
    .popup {
      margin: auto;
      width: 400px;
      max-width: 50%;
      margin-top: 200px;
      padding: 16px;
      border: 1px solid #999;
      border-radius: 3px;
      background-color: #fff;
    }
    .popup h3 {
      font-size: 20px;
      margin-top: 0;
    }

    #block_dialogs {
      position: absolute;
      left: 0;
      top: 0;
      width: 40%;
      height: 60%;
      box-shadow: 1px 0 1px rgba(0,0,0,0.1);
      border-right: 1px solid rgba(0,0,0,0.25);
      margin-right: -1px;
      overflow-y: auto;
    }
    #block_map {
      position: absolute;
      left: 0;
      top: 60%;
      width: 40%;
      height: 40%;
      box-shadow: 1px 0 1px rgba(0,0,0,0.1);
      border-right: 1px solid rgba(0,0,0,0.25);
      margin-right: -1px;
    }
    .item_dialog {
      height: 40px;
      padding: 8px 0;
      border-bottom: 1px solid #eaeaea;
      border-left: 10px solid transparent;
      border-right: 20px solid transparent;
      background: #fff;
      cursor: pointer;
    }
    .item_dialog:hover {
      background: #def;
    }
    .item_dialog.active {
      background: #bfdfff;
    }
    .item_dialog .photo {
      float: left;
      margin-right: 10px;
    }
    .item_dialog .photo img {
      width: 40px;
    }
    .item_dialog .title {
      font-weight: bold;
    }
    .item_dialog .message {

    }
    .item_placemark {

    }
    .item_placemark .title {
      font-weight: bold;
    }
    .item_placemark .photo {
      float: left;
      margin-right: 6px;
    }
    .item_placemark .photo img {
      width: 44px;
    }
    #block_dialog {
      position: absolute;
      left: 40%;
      top: 0;
      width: 60%;
      height: 100%;
      display: none;
      background-color: #d6e4ef;
    }
    #block_dialog .loading {
      padding: 30%;
      text-align: center;
      font-size: 16px;
      color: #999;
      text-shadow: 1px 1px 0 #fff;
    }
    #block_messages {
      position: absolute;
      bottom: 32px;
      overflow-y: auto;
      max-height: 100%;
      width: 100%;
    }
    #block_compose {
      position: absolute;
      bottom: 0;
      width: 100%;
    }
    .compose_wrap {
      margin: 3px 130px 3px 6px;
    }
    .compose_wrap input {
      width: 100%;
    }
    .item_action {
      clear: both;
      text-align: center;
      padding: 8px;
      color: #999;
      text-shadow: 1px 1px 0 #fff;
    }
    .item_action span {
      background-color: #eeeeee;
      padding: 4px 6px;
      border: 1px solid #ccc;
      border-radius: 2px;
    }
    .item_action .photo {
      padding-top: 8px;
    }
    .item_action .photo img {
      background-color: #fff;
      padding: 2px;
      margin: 2px;
      border-radius: 3px;
      font-size: 0;
      box-shadow: 1px 1px 0 rgba(0,0,0,0.1);
      width: 300px;
    }
    .item_message {
      clear: both;
      position: relative;
    }
    .item_message .inner_wrap {
      margin-bottom: -40px;
      min-height: 40px;
      padding: 1px 4px 1px 3px;
    }
    .item_message .author {
      margin: 2px 0;
    }
    .item_message .message {

    }
    .item_message .photo {
      position: absolute;
      bottom: 0;
      background-color: #fff;
      padding: 2px;
      margin: 2px;
      border-radius: 3px;
      font-size: 0;
      box-shadow: 1px 1px 0 rgba(0,0,0,0.1);
    }
    .item_message .photo img {
      width: 46px;
    }
    .item_message .outer_wrap {
      max-width: 80%;
    }
    .item_message .inner_wrap {
      position: relative;
    }
    .item_message .date {
      position: absolute;
      right: 1px;
      bottom: 1px;
      font-size: 11px;
      color: #aaa;
    }
    .item_message .media + .date {
      right: 4px;
      bottom: 4px;
      background: rgba(255,255,255,0.7);
      padding: 2px 3px;
      border-radius: 2px;
      color: #888;
    }
    .item_message .fantom_date {
      visibility: hidden;
      font-size: 11px;
      white-space: nowrap;
    }

    .msg_in {
      float: left;
    }
    .msg_in .outer_wrap {
      float: left;

      border-style: solid;
      border-width: 6px 6px 46px 19px;
      -moz-border-image: url(img/msg_in.png?1) 6 6 46 19 repeat stretch;
      -webkit-border-image: url(img/msg_in.png?1) 6 6 46 19 repeat stretch;
      -o-border-image: url(img/msg_in.png?1) 6 6 46 19 repeat stretch;
      border-image: url(img/msg_in.png?1) 6 6 46 19 fill repeat stretch;
    }
    .multi .msg_in .outer_wrap {
      margin-left: 60px;
    }

    .msg_in .photo {
      left: 5px;
    }
    .msg_out {
      float: right;
    }
    .msg_out .outer_wrap {
      float: right;

      border-style: solid;
      border-width: 6px 19px 46px 6px;
      -moz-border-image: url(img/msg_out.png?1) 6 19 46 6 repeat stretch;
      -webkit-border-image: url(img/msg_out.png?1) 6 19 46 6 repeat stretch;
      -o-border-image: url(img/msg_out.png?1) 6 19 46 6 repeat stretch;
      border-image: url(img/msg_out.png?1) 6 19 46 6 fill repeat stretch;
    }
    .multi .msg_out .outer_wrap {
      margin-right: 60px;
    }

    .msg_out .photo {
      right: 5px;
    }

    #button_send {
      float: right;
      width: 117px;
      margin: 3px;
    }
  </style>
</head>
<body onload="init()">
<div id="debug" style="display:none"></div>

<div id="content">
  <div id="page_splash" class="popup" style="text-align: center; font-size: 20px; display: block;">Инициализация...</div>
  <div id="page_login" class="popup">
    <h3>Вход</h3>
    <p>Укажите номер своего мобильного телефона — на него будет отправлен авторизационный код.</p>
    <p>Ваш телефон:</p>
    +<input type="text" id="edit_phone" value="7"/>
    <button onclick="sendCode();">Отправить код</button>
    <div id="block_code" style="display: none">
      <p>На ваш номер отправлено СМС с кодом. Введите его, чтобы войти.</p>
      <p>Авторизационный код:</p>
      <input type="text" id="edit_code"/>
      <button onclick="checkCode();">Войти</button>
    </div>
  </div>
  <div id="page_signup" class="popup">
    <h3>Регистрация</h3>
  </div>
  <div id="page_dialogs">
    <div id="block_dialog">
      <div id="block_messages">

      </div>
      <div id="block_compose">
        <button id="button_send" onclick="sendMessage();">Отправить</button>
        <div class="compose_wrap"><input type="text" id="edit_compose"/></div>
      </div>
    </div>
    <div id="block_dialogs">

    </div>
    <div id="block_map">

    </div>
  </div>
</div>

<script>
  /** CLEAR LOCALSTORAGE, DEBUG ONLY **/
  for (var i in localStorage) {
    if (i.indexOf('mtproto.') == 0) {
      delete localStorage[i];
    }
  }

  function ge(id) {
    return document.getElementById(id);
  }
  function num(n,cs) {
    n = n % 100;
    if ((n % 10 == 0) || (n % 10 > 4) || (n > 4 && n < 21)) {
      return cs[2];
    } else
    if (n % 10 == 1) {
      return cs[0];
    } else {
      return cs[1];
    }
  }

  var connected = false;
  var socket;
  function init() {
    /**
     * IMPORTANT NOTE: local server (my dcpu.ru) is used only to deal with cross-domain restrictions.
     * It only redirects encrypted packets and does not store nor modifies their content. There's no
     * threat to the privacy because all keys are stored only at client-side and never sent to server
     * (so it can be considered as a 'man-in-the-middle', and MTProto is protected from such kinds of
     * attacks)
     */
    socket = io.connect('http://dcpu.ru:8080/');
    socket.on('connect', function() {
      if (connected) return;
      connected = true;

      var transports = {};

      function TCPTransport(host, port, onConnect, onData, onClose, onError) {
        if (transports[host + ':' + port] && transports[host + ':' + port].connected) {
          return transports[host + ':' + port];
        }

        this.host = host;
        this.port = port;
        this.onConnect = onConnect;
        this.onData = onData;
        this.onClose = onClose;
        this.onError = onError;
        this.connected = false;
        this.packet = 0;

        transports[host + ':' + port] = this;
        socket.emit('mt-connect', host, port);
      }
      TCPTransport.prototype.send = function(data, onComplete) {
        var length = (data.length << 1) + 12;
        var packet = this.packet++;

        var buffer =
          String.fromCharCode(length & 0xffff) + String.fromCharCode(length >>> 16) +
          String.fromCharCode(packet & 0xffff) + String.fromCharCode(packet >>> 16) +
          data;

        var crc32 = buffer.crc32(true);

        buffer +=
          String.fromCharCode(crc32 & 0xffff) + String.fromCharCode(crc32 >>> 16);

        //console.log('Writing ' + (buffer.length << 1) + ' bytes:\n' + buffer.hexDump(true));
        socket.emit('mt-write', this.socketId, buffer.toBase64());
        this.onWrite = onComplete;
      }
      TCPTransport.prototype.close = function(onComplete) {
        this.connected = false;

        console.log('Closing ' + this.host + ':' + this.port);
        socket.emit('mt-close', this.socketId);
        onComplete();
        this.onClose();
      }

      socket.on('mt-test', function(s, data) {
        console.log(s, data);
      });
      socket.on('mt-stats', function(stats) {
        console.log(stats);
      });

      socket.on('mt-data', function(id, data) {
        data = String.fromBase64(data);
        //console.log('Reading ' + (data.length << 1) + ' bytes:\n' + data.hexDump(true));
        if (transports[id]) {
          var buffer = (transports[id].buffer || '') + data;
          if (buffer.length >= 2 && transports[id].onData) {
            var length = buffer.charCodeAt(0) | (buffer.charCodeAt(1) << 16);
            if (buffer.length >= length >> 1) {
              transports[id].onData(buffer.substr(4, (length - 12) >> 1));
              buffer = buffer.substr(length >> 1);
            }
          }
          transports[id].buffer = buffer;
        }
      });

      socket.on('mt-connect', function(id, host, port) {
        transports[id] = transports[host + ':' + port];
        transports[id].connected = true;
        transports[id].socketId = id;
        if (transports[id].onConnect) {
          transports[id].onConnect();
        }
      });
      socket.on('mt-error', function(id, error) {
        if (transports[id] && transports[id].onError) {
          transports[id].onError(error);
        }
      });
      socket.on('mt-close', function(id) {
        if (transports[id]) {
          transports[id].connected = false;
          if (transports[id].onClose) {
            transports[id].onClose();
          }
        }
      });
      socket.on('mt-write', function(id) {
        if (transports[id] && transports[id].onWrite) {
          transports[id].onWrite();
          transports[id].onWrite = null;
        }
      });

      //socket.emit('mt-connect', '173.240.5.1', 443); // first DC
      mtproto.transport = TCPTransport;
      mtproto.init(function(server) {
        mtproto.call(new api.help.getConfig());
        if (myID = server.isLoggedIn()) {
          loggedIn();
        } else {
          ge('page_splash').style.display = 'none';
          ge('page_login').style.display = 'block';
          ge('edit_phone').focus();
        }
      });
    });
  }

  var myID = false;

  var phone = false;
  var sentCode = false;
  function sendCode() {
    phone = ge('edit_phone').value;

    mtproto.call(new api.auth.sendCode(phone, 0, 1220, 'e9bac3af3eef81acd2d8576c14a9dfd0', 'ru'), function(result) {
      sentCode = result;

      ge('page_splash').style.display = 'none';
      ge('page_login').style.display = 'block';
      ge('block_code').style.display = 'block';
    });

    ge('page_splash').innerHTML = 'Отправка сообщения с кодом...';
    ge('page_splash').style.display = 'block';
    ge('page_login').style.display = 'none';
  }

  var messages = {};
  var users = {};
  var chats = {};

  var placeholder_colors = ['red', 'green', 'yellow', 'blue', 'purple', 'pink', 'cyan', 'orange'];
  var username_colors = ['#ee4928', '#41a903', '#e09602', '#0f94ed', '#8f3bf7', '#fc4380', '#00a1c4', '#eb7002'];

  function checkCode() {
    var code = ge('edit_code').value;

    mtproto.call(new api.auth.signIn(phone, sentCode.phone_code_hash, code), function(result) {
      mtproto.servers.main.setLoggedIn(result);

      myID = result.user.id;

      loggedIn();
    });

    ge('page_splash').innerHTML = 'Авторизация...';
    ge('page_splash').style.display = 'block';
    ge('page_login').style.display = 'none';
  }

  var map;
  var markers;

  function chatIconHTML(chat, pic) {
    return '<div id="placemark' + chat.id + '" class="item_placemark">' +
      (pic ? '<div class="photo">' + pic + '</div>' : '') +
    '<div style="' + (pic ? 'padding-left: 50px;' : '') + '">' +
      (chat.title ? '<div class="title">' + chat.title + '</div>' : '') +
      (chat.address ? '<div class="address">' + chat.address + '</div>' : '') +
      '<div class="participants">' + chat.participants_count + ' ' + num(chat.participants_count, ['участник', 'участника', 'участников']) + '</div>' +
    '</div></div>';
  }

  function updateMap() {
    var center = map.getCenter();
    var bounds = map.getBounds();
    var diagonal = ymaps.coordSystem.geo.getDistance(bounds[0], bounds[1]);

    mtproto.call(new api.geochats.getLocated(new api.inputGeoPoint(center[0], center[1]), diagonal / 2, 1000), function(result) {
      for (var i = 0; i < result.messages.length; i++) {
        messages[result.messages[i].id] = result.messages[i];
      }
      for (var i = 0; i < result.chats.length; i++) {
        chats[result.chats[i].id] = result.chats[i];
      }
      for (var i = 0; i < result.users.length; i++) {
        users[result.users[i].id] = result.users[i];
      }

      markers.removeAll();

      for (var i = 0; i < result.results.length; i++) {
        var chat = chats[result.results[i].chat_id];
        var placemark = new ymaps.Placemark([chat.geo.lat, chat.geo.long], {
          iconContent: chatIconHTML(chat),
          id: chat.id
        });
        (function(chat) {
          placemark.events.add('click', function() {
            showDialog(ge('placemark' + chat.id), new api.inputGeoChat(chat.id, chat.access_hash), true);
          });
        })(chat);
        markers.add(placemark);

        if (chat.photo && chat.photo.photo_small) {
          var pic = chat.photo.photo_small;
          (function(chat, placemark) {
            mtproto.downloadFile(pic, function(bytes, type) {
              var contentType = 'image/*';
              if (type.constructor == api.storage.fileJpeg) {
                contentType = 'image/jpeg';
              } else
              if (type.constructor == api.storage.fileGif) {
                contentType = 'image/gif';
              } else
              if (type.constructor == api.storage.filePng) {
                contentType = 'image/png';
              }
              placemark.properties.set('iconContent', chatIconHTML(chat, '<img src="data:' + contentType + ';base64,' + bytes.toBase64() + '"/>'));
            });
          })(chat, placemark);
        }
      }
    });
  }

  function loggedIn() {
    ymaps.ready(function() {
      map = new ymaps.Map('block_map', {
        center: [59.938531,30.313497],
        zoom: 13
      });

      map.controls.add('zoomControl');
      map.behaviors.enable('scrollZoom');

      map.events.add('boundschange', updateMap);

      markers = new ymaps.GeoObjectCollection({

      }, {
        preset: 'twirl#blueStretchyIcon'
      });
      map.geoObjects.add(markers);

      updateMap();
    });

    setInterval(function() {
      mtproto.call(new mt.ping(new goog.math.Long((Math.random() * 1000000)|0, (Math.random() * 1000000)|0)));
    }, 500);

    mtproto.call(new api.messages.getDialogs(0, 0, 0), function(result) {
      for (var i = 0; i < result.messages.length; i++) {
        messages[result.messages[i].id] = result.messages[i];
      }
      for (var i = 0; i < result.chats.length; i++) {
        chats[result.chats[i].id] = result.chats[i];
      }
      for (var i = 0; i < result.users.length; i++) {
        users[result.users[i].id] = result.users[i];
      }

      var dialogList = [];
      for (var i = 0; i < result.dialogs.length; i++) {
        var topMessage = messages[result.dialogs[i].top_message];
        if (result.dialogs[i].peer.constructor == api.peerUser) {
          var user = users[result.dialogs[i].peer.user_id];
          var id = 'dialog_user' + user.id;
          var title = user.first_name + ' ' + user.last_name;
          var click = 'showDialog(this, getInputPeerUser(' + user.id + '));';

          var placeholder = 'img/user_placeholder_' + placeholder_colors[user.id % 8] + '.png';
          if (user.photo) {
            var pic = user.photo.photo_small;
          }
        } else {
          var chat = chats[result.dialogs[i].peer.chat_id];
          var id = 'dialog_chat' + chat.id;
          var title = chat.title;
          var click = 'showDialog(this, getInputPeerChat(' + chat.id + '));';

          var placeholder = 'img/group_placeholder_' + placeholder_colors[chat.id % 8] + '.png';
          if (chat.photo) {
            var pic = chat.photo.photo_small;
          }
        }
        dialogList.push('<div id="' + id + '" class="item_dialog" onclick="' + click + '"><div class="photo"><img src="' + placeholder + '"/></div><div class="title">' + title + '</div><div class="message">' + getMessageText(topMessage) + '</div></div>');
      }
      ge('block_dialogs').innerHTML = dialogList.join('');

      for (var i = 0; i < result.dialogs.length; i++) {
        var topMessage = messages[result.dialogs[i].top_message];
        if (result.dialogs[i].peer.constructor == api.peerUser) {
          var user = users[result.dialogs[i].peer.user_id];
          loadUserpic(user, ge('dialog_user' + user.id).children[0]);
        } else {
          var chat = chats[result.dialogs[i].peer.chat_id];
          loadUserpic(chat, ge('dialog_chat' + chat.id).children[0]);
        }
      }

      ge('page_splash').style.display = 'none';
      ge('page_dialogs').style.display = 'block';
    });

    ge('page_splash').innerHTML = 'Загрузка...';
  }

  function getImageData(bytes, type) {
    var contentType = 'image/*';
    if (type.constructor == api.storage.fileJpeg) {
      contentType = 'image/jpeg';
    } else
    if (type.constructor == api.storage.fileGif) {
      contentType = 'image/gif';
    } else
    if (type.constructor == api.storage.filePng) {
      contentType = 'image/png';
    }
    return contentType + ';base64,' + bytes.toBase64();
  }

  function loadUserpic(user, container) {
    if (user.photo && user.photo.photo_small) {
      loadFile(user.photo.photo_small, container);
    }
  }
  function loadFile(location, container) {
    mtproto.downloadFile(location, function(bytes, type) {
      if (document.contains(container)) {
        container.innerHTML = '<img src="data:' + getImageData(bytes, type) + '"/>';
      }
    });
  }
  function loadPhoto(photo, preferredSize, container) {
    mtproto.downloadPhoto(photo, preferredSize, function(bytes, type) {
      if (document.contains(container)) {
        container.innerHTML = '<img src="data:' + getImageData(bytes, type) + '"/>';
      }
    });
  }

  function getInputPeerUser(userId) {
    if (users[userId].access_hash) {
      return new api.inputPeerForeign(userId, users[userId].access_hash);
    } else {
      return new api.inputPeerContact(userId);
    }
  }

  function getInputPeerChat(chatId) {
    return new api.inputPeerChat(chatId);
  }

  function getShortTime(date) {
    var time = new Date(date * 1000);
    return time.getHours() + ':' + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes();
  }

  function getMessageText(message) {
    var user = users[message.from_id];
    if (message.action) {
      var action = 'Участник ' + user.first_name + ' ' + user.last_name + ' ';
      if (message.action.constructor == api.messageActionChatCreate) {
        action += 'создал чат';
      } else
      if (message.action.constructor == api.messageActionGeoChatCreate) {
        action += 'создал геочат';
      } else
      if (message.action.constructor == api.messageActionChatEditTitle) {
        action += 'изменил название чата на «' + message.action.title + '»';
      } else
      if (message.action.constructor == api.messageActionChatEditPhoto) {
        action += 'изменил фото чата';
      } else
      if (message.action.constructor == api.messageActionChatDeletePhoto) {
        action += 'удалил фото чата';
      } else
      if (message.action.constructor == api.messageActionChatAddUser) {
        action += 'пригласил участника ' + users[message.action.user_id].first_name + ' ' + users[message.action.user_id].last_name;
      } else
      if (message.action.constructor == api.messageActionChatDeleteUser) {
        action += 'с позором выгнал участника ' + users[message.action.user_id].first_name + ' ' + users[message.action.user_id].last_name;
      } else
      if (message.action.constructor == api.messageActionGeoChatCheckin) {
        action += 'отметился в этом месте';
      }
      return action;
    } else {
      return message.message;
    }
  }

  var currentPeer;
  var currentGeo;
  var currentMulti;

  function showDialog(item, inputPeer, geo) {
    var items = ge('block_dialogs').children;
    for (var i = 0; i < items.length; i++) {
      items[i].className = 'item_dialog';
    }
    markers.each(function(marker) {
      ge('placemark' + marker.properties.get('id')).parentNode.parentNode.parentNode.style.background = '#fff';
    });
    if (geo) {
      item.parentNode.parentNode.parentNode.style.background = '#bfdfff'; // hack-ity hack
    } else {
      item.className = 'item_dialog active';
    }
    ge('block_dialog').style.display = 'block';

    currentPeer = inputPeer;
    currentGeo = geo;
    var multi = currentMulti = (inputPeer.constructor == api.inputPeerChat) || (inputPeer.constructor == api.inputGeoChat);
    ge('block_dialog').className = multi ? 'multi' : '';

    ge('block_messages').innerHTML = '<div class="loading">Загрузка...</div>';


    mtproto.call(new (geo ? api.geochats : api.messages).getHistory(inputPeer, 0, 0, 100), function(result) {
      for (var i = 0; i < result.messages.length; i++) {
        messages[result.messages[i].id] = result.messages[i];
      }
      for (var i = 0; i < result.chats.length; i++) {
        chats[result.chats[i].id] = result.chats[i];
      }
      for (var i = 0; i < result.users.length; i++) {
        users[result.users[i].id] = result.users[i];
      }

      var messageList = ['<div style="height: 32px"></div>'];
      for (var i = result.messages.length - 1; i >= 0; i--) {
        messageList.push(getMessageHTML(result.messages[i], multi));
      }

      ge('block_messages').innerHTML = messageList.join('');

      for (var i = result.messages.length - 1; i >= 0; i--) {
        postProcessMessage(result.messages[i], multi);
      }
    });
  }

  function getMessageHTML(message, multi) {
    var user = users[message.from_id];
    if (message.action) {
      return '<div id="message' + message.id + '" class="item_action"><span>' + getMessageText(message) + '</span>' + (message.action.photo ? '<div class="photo"></div>' : '') + '</div>';
    } else {
      return '<div id="message' + message.id + '" class="item_message ' + (message.out ? 'msg_out' : 'msg_in') + '">' +
        (multi ? '<div class="photo"><img src="img/user_placeholder_' + placeholder_colors[user.id % 8] + '.png"/></div>' : '') +
        '<div class="outer_wrap"><div class="inner_wrap">' +
          (multi ? '<div class="author" style="color: ' + username_colors[user.id % 8] + ';">' + user.first_name + ' ' + user.last_name + '</div>' : '') +
          (message.message ? '<div class="message">' + getMessageText(message) + '<span class="fantom_date">' + getShortTime(message.date) + '</span></div>' : '') +
          (message.media.constructor != api.messageMediaEmpty ? '<div id="media' + message.id + '" class="media"></div>' : '') +
          '<div class="date">' + getShortTime(message.date) + '</div>' +
        '</div></div>' +
      '</div>';
    }
  }

  function postProcessMessage(message, multi) {
    var user = users[message.from_id];

    if (multi && !message.action) {
      loadUserpic(user, ge('message' + message.id).children[0]);
    } else
    if (message.action && message.action.photo) {
      loadPhoto(message.action.photo, 'x', ge('message' + message.id).children[1]);
    }
    if (message.media && message.media.constructor == api.messageMediaPhoto) {
      loadPhoto(message.media.photo, 'm', ge('media' + message.id));
    } else
    if (message.media && message.media.constructor == api.messageMediaVideo) {
      loadFile(message.media.video.thumb.location, ge('media' + message.id));
    }
  }

  function appendMessage(message) {
    var wrap = document.createElement('div');
    wrap.innerHTML = getMessageHTML(message, currentMulti);
    ge('block_messages').appendChild(wrap.children[0]);
    postProcessMessage(message, currentMulti);
  }

  function sendMessage() {
    var text = ge('edit_compose').value;
    ge('edit_compose').value = '';

    mtproto.call(new (currentGeo ? api.geochats : api.messages).sendMessage(currentPeer, text, new goog.math.Long((Math.random() * 1000000)|0, (Math.random() * 1000000)|0)), function(result) {

      if (result.message) {
        appendMessage(result.message);
      } else {
        appendMessage(new api.message(result.id, myID, false, true, false, result.date, text, new api.messageMediaEmpty()));
      }
    });
  }
</script>

</body>
</html>