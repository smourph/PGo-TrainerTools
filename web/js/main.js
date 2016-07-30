'use strict';

$(document).ready(function () {
    trainerToolsView.init();
});

var trainerToolsView = {
    userIndex: 0,
    emptyDex: [],
    numTrainers: [
        177,
        109
    ],
    teams: [
        'TeamLess',
        'Mystic',
        'Valor',
        'Instinct'
    ],
    trainerSex: [
        'm',
        'f'
    ],
    pathColors: [
        '#A93226',
        '#884EA0',
        '#2471A3',
        '#17A589',
        '#229954',
        '#D4AC0D',
        '#CA6F1E',
        '#CB4335',
        '#7D3C98',
        '#2E86C1',
        '#138D75',
        '#28B463',
        '#D68910',
        '#BA4A00'
    ],
    pokemonArray: {},
    pokemoncandyArray: {},
    itemsArray: {},
    trainer_data: {},
    settings: {},

    init: function () {
        var self = this;

        self.settings = $.extend(true, self.settings, userInfo);

        self.bindUI();

        self.log({
            message: 'Loading Data...',
            color: "blue-text"
        });

        var pokemonsJsonFile = 'data/pokemons.json';
        self.loadJSON(pokemonsJsonFile, function (data, successData) {
            self.pokemonArray = data;
        }, self.errorFunc, 'Failed to load \'' + pokemonsJsonFile + '\' file');

        var candiesJsonFile = 'data/candies.json';
        self.loadJSON(candiesJsonFile, function (data, successData) {
            self.pokemoncandyArray = data;
        }, self.errorFunc, 'Failed to load \'' + candiesJsonFile + '\' file');

        var itemsJsonFile = 'data/items.json';
        self.loadJSON(itemsJsonFile, function (data, successData) {
            self.itemsArray = data;
        }, self.errorFunc, 'Failed to load \'' + itemsJsonFile + '\' file');

        self.log({
            message: 'Data Loaded !',
            color: "green-text"
        });

        for (var i = 0; i < self.settings.users.length; i++) {
            var user = self.settings.users[i];
            self.trainer_data[user] = {};
        }

        self.initView();
    },

    // TODO: recheck de la fonction quand tous les menus seront présents
    bindUI: function () {
        var self = this;

        $('#logs-button').click(function () {
            $('#logs-panel').toggle();
        });
        // Init tooltip
        $(document).ready(function () {
            $('.tooltipped').tooltip({
                delay: 50
            });
        });

        // Build content view when an item is selected
        $('body').on('click', ".bot-user .bot-items .btn", function () {
            var itemIndex = $(this).parent().parent().find('.btn').index($(this)) + 1,
                userId = $(this).closest('ul').data('user-id');

            self.buildContentView(userId, itemIndex);
        });

        $('body').on('click', '#close', function () {
            $('#submenu').toggle();
        });

        // Binding sorts
        $('body').on('click', '.pokemon-sort a', function () {
            var item = $(this);
            self.sortAndShowBagPokemon(item.data('sort'), item.parent().parent().data('user-id'));
        });
        $('body').on('click', '.pokedex-sort a', function () {
            var item = $(this);
            self.sortAndShowPokedex(item.data('sort'), item.parent().parent().data('user-id'));
        });
    },

    initView: function () {
        var self = this;

        self.loadTrainersFiles();
    },

    loadTrainersFiles: function () {
        var self = trainerToolsView;

        for (var i = 0; i < self.settings.users.length; i++) {
            self.log({
                message: "Starting to load trainer " + self.settings.users[i],
                color: "blue-text"
            });
            self.loadJSON('inventory-' + self.settings.users[i] + '.json', self.getInventoryData, self.errorFunc, i);
            self.loadJSON('player-' + self.settings.users[i] + '.json', self.getPlayerData, self.errorFunc, i);
            self.loadJSON('settings-' + self.settings.users[i] + '.json', self.getSettingsData, self.errorFuncForSettingFileLoad, i);

            self.log({
                message: "Trainer loaded: " + self.settings.users[i],
                color: "green-text"
            });
        }
    },

    getInventoryData: function (data, user_index) {
        var self = trainerToolsView,
            trainerData = self.trainer_data[self.settings.users[user_index]],
            bagCandy = self.filterInventory(data, 'candy'),
            bagItems = self.filterInventory(data, 'item'),
            bagPokemon = self.filterInventory(data, 'pokemon_data'),
            pokedex = self.filterInventory(data, 'pokedex_entry'),
            stats = self.filterInventory(data, 'player_stats');

        trainerData.bagCandy = bagCandy;
        trainerData.bagItems = bagItems;
        trainerData.bagPokemon = bagPokemon;
        trainerData.pokedex = pokedex;
        trainerData.stats = stats;

        self.trainer_data[self.settings.users[user_index]] = trainerData;
    },

    getPlayerData: function (data, user_index) {
        var self = trainerToolsView,
            trainerData = self.trainer_data[self.settings.users[user_index]];

        trainerData.player = data;
        self.trainer_data[self.settings.users[user_index]] = trainerData;

        if (user_index + 1 === self.settings.users.length) {
            self.buildTrainersMenu();
        }
    },

    getSettingsData: function (data, user_index) {
        var self = trainerToolsView,
            trainerData = self.trainer_data[self.settings.users[user_index]];

        trainerData.settings = data;
        self.trainer_data[self.settings.users[user_index]] = trainerData;
    },

    buildTrainersMenu: function () {
        var self = this,
            users = self.settings.users,
            out = '<div class="col s12"><ul id="trainers-list" class="collapsible" data-collapsible="accordion"> \
              <li><div class="collapsible-title"><i class="material-icons">people</i>Trainers</div></li>';

        for (var i = 0; i < users.length; i++) {
            var team = self.getTeam(users[i]);

            var content = '<li class="bot-user">\
            <div class="collapsible-header trainer-name">{0}</div>\
                <div class="collapsible-body">\
                    <ul class="bot-items" data-user-id="{1}">\
                       <li><a class="team-' + team + ' waves-effect waves-light btn tInfo">Info</a></li><br>\
                       <li><a class="team-' + team + ' waves-effect waves-light btn tItems">Items</a></li><br>\
                       <li><a class="team-' + team + ' waves-effect waves-light btn tPokemon">Pokemon</a></li><br>\
                       <li><a class="team-' + team + ' waves-effect waves-light btn tPokedex">Pokedex</a></li>\
                   </ul>\
               </div>\
           </li>';
            out += content.format(users[i], i);
        }
        out += "</ul></div>";
        $('#trainers').html(out);
        $('.collapsible').collapsible();
    },

    buildContentView: function (userId, menu) {
        var self = this,
            out = '';

        $("#submenu").show();
        switch (menu) {
            case 1:
                var team = self.getTeam(self.settings.users[userId]);

                var current_user_stats = self.trainer_data[self.settings.users[userId]].stats[0].inventory_item_data.player_stats;
                $('#subtitle').html('Trainer Info');
                $('#sort-buttons').html('');

                out += '<div class="row"><div class="col s12"><h5>' +
                    self.settings.users[userId] +
                    '</h5><br>Level: ' +
                    current_user_stats.level +
                    '<br><div class="progress teambar-' + team + '" style="height: 10px"> <div class="determinate team-' + team + '" style="width: ' +
                    (current_user_stats.experience /
                    current_user_stats.next_level_xp) * 100 +
                    '%"></div></div>Exp: ' +
                    current_user_stats.experience +
                    '<br>Exp to Lvl ' +
                    (parseInt(current_user_stats.level, 10) + 1) +
                    ': ' +
                    (parseInt(current_user_stats.next_level_xp, 10) - current_user_stats.experience) +
                    '<br>Pokemon Encountered: ' +
                    (current_user_stats.pokemons_encountered || 0) +
                    '<br>Pokeballs Thrown: ' +
                    (current_user_stats.pokeballs_thrown || 0) +
                    '<br>Pokemon Caught: ' +
                    (current_user_stats.pokemons_captured || 0) +
                    '<br>Small Ratata Caught: ' +
                    (current_user_stats.small_rattata_caught || 0) +
                    '<br>Pokemon Evolved: ' +
                    (current_user_stats.evolutions || 0) +
                    '<br>Eggs Hatched: ' +
                    (current_user_stats.eggs_hatched || 0) +
                    '<br>Unique Pokedex Entries: ' +
                    (current_user_stats.unique_pokedex_entries || 0) +
                    '<br>PokeStops Visited: ' +
                    (current_user_stats.poke_stop_visits || 0) +
                    '<br>Kilometers Walked: ' +
                    (parseFloat(current_user_stats.km_walked).toFixed(2) || 0) +
                    '</div></div>';

                $('#subcontent').html(out);
                break;
            case 2:
                var current_user_bag_items = self.trainer_data[self.settings.users[userId]].bagItems;
                $('#subtitle').html(current_user_bag_items.length + " item" + (current_user_bag_items.length !== 1 ? "s" : "") + " in Bag");

                $('#sort-buttons').html('');

                out = '<div class="items"><div class="row">';
                for (var i = 0; i < current_user_bag_items.length; i++) {
                    out += '<div class="col s12 m6 l3 center" style="float: left"><img src="image/items/' +
                        current_user_bag_items[i].inventory_item_data.item.item_id +
                        '.png" class="item_img"><br><b>' +
                        self.itemsArray[current_user_bag_items[i].inventory_item_data.item.item_id] +
                        '</b><br>Count: ' +
                        (current_user_bag_items[i].inventory_item_data.item.count || 0) +
                        '</div>';
                }
                out += '</div></div>';
                var nth = 0;
                out = out.replace(/<\/div><div/g, function (match, i, original) {
                    nth++;
                    return (nth % 4 === 0) ? '</div></div><div class="row"><div' : match;
                });
                $('#subcontent').html(out);
                break;
            case 3:
                var pkmnTotal = self.trainer_data[self.settings.users[userId]].bagPokemon.length;
                $('#subtitle').html(pkmnTotal + " Pokemon");

                var sortButtons = '<div class="col s12 pokemon-sort" data-user-id="' + userId + '">Sort : ';
                sortButtons += '<div class="chip"><a href="#" data-sort="cp">CP</a></div>';
                sortButtons += '<div class="chip"><a href="#" data-sort="iv">IV</a></div>';
                sortButtons += '<div class="chip"><a href="#" data-sort="name">Name</a></div>';
                sortButtons += '<div class="chip"><a href="#" data-sort="id">ID</a></div>';
                sortButtons += '<div class="chip"><a href="#" data-sort="time">Time</a></div>';
                sortButtons += '</div>';

                $('#sort-buttons').html(sortButtons);

                self.sortAndShowBagPokemon('cp', userId);
                break;
            case 4:
                var pkmnTotal = self.trainer_data[self.settings.users[userId]].pokedex.length;
                $('#subtitle').html('Pokedex ' + pkmnTotal + ' / 151');

                var sortButtons = '<div class="col s12 pokedex-sort" dat-user-id="' + userId + '">Sort : ';
                sortButtons += '<div class="chip"><a href="#" data-sort="id">ID</a></div>';
                sortButtons += '<div class="chip"><a href="#" data-sort="name">Name</a></div>';
                sortButtons += '<div class="chip"><a href="#" data-sort="enc">Seen</a></div>';
                sortButtons += '<div class="chip"><a href="#" data-sort="cap">Caught</a></div>';
                sortButtons += '</div>';

                $('#sort-buttons').html(sortButtons);

                self.sortAndShowPokedex('id', userId);
                break;
            default:
                break;
        }
    },

    filterInventory: function (arr, search) {
        var filtered = [];

        for (var i = 0; i < arr.length; i++) {
            if (arr[i].inventory_item_data[search] != undefined) {
                filtered.push(arr[i]);
            }
        }
        return filtered;
    },

    getCandy: function (p_num, userId) {
        var self = this,
            user = self.trainer_data[self.settings.users[userId]];

        for (var i = 0; i < user.bagCandy.length; i++) {
            var checkCandy = user.bagCandy[i].inventory_item_data.candy.family_id;
            if (self.pokemoncandyArray[p_num] === checkCandy) {
                return (user.bagCandy[i].inventory_item_data.candy.candy || 0);
            }
        }
    },

    getTeam: function (user) {
        var self = this,
            playerInfo = self.trainer_data[user].player;

        if (playerInfo && typeof playerInfo !== 'undefined' && playerInfo.length !== 0) {
            return playerInfo.team;
        } else {
            self.log({
                message: 'No team was found for ' + user + '.',
                color: "red-text"
            });
            return 0
        }
    },

    pad_with_zeroes: function (number, length) {
        var my_string = '' + number;

        while (my_string.length < length) {
            my_string = '0' + my_string;
        }
        return my_string;
    },

    sortAndShowBagPokemon: function (sortOn, userId) {
        var self = this,
            eggs = 0,
            sortedPokemon = [],
            out = '',
            user = self.trainer_data[self.settings.users[userId]],
            userId = userId || 0;

        if (!user.bagPokemon.length) return;

        out = '<div class="items"><div class="row">';
        for (var i = 0; i < user.bagPokemon.length; i++) {
            if (user.bagPokemon[i].inventory_item_data.pokemon_data.is_egg) {
                eggs++;
                continue;
            }
            var pokemonData = user.bagPokemon[i].inventory_item_data.pokemon_data,
                pkmID = pokemonData.pokemon_id,
                pkmnName = self.pokemonArray[pkmID - 1].Name,
                pkmCP = pokemonData.cp,
                pkmIVA = pokemonData.individual_attack || 0,
                pkmIVD = pokemonData.individual_defense || 0,
                pkmIVS = pokemonData.individual_stamina || 0,
                pkmIV = ((pkmIVA + pkmIVD + pkmIVS) / 45.0).toFixed(2),
                pkmTime = pokemonData.creation_time_ms || 0;

            sortedPokemon.push({
                "name": pkmnName,
                "id": pkmID,
                "cp": pkmCP,
                "iv": pkmIV,
                "attack": pkmIVA,
                "defense": pkmIVD,
                "stamina": pkmIVS,
                "creation_time": pkmTime
            });
        }
        switch (sortOn) {
            case 'name':
                sortedPokemon.sort(function (a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    if (a.cp > b.cp) return -1;
                    if (a.cp < b.cp) return 1;
                    return 0;
                });
                break;
            case 'id':
                sortedPokemon.sort(function (a, b) {
                    if (a.id < b.id) return -1;
                    if (a.id > b.id) return 1;
                    if (a.cp > b.cp) return -1;
                    if (a.cp < b.cp) return 1;
                    return 0;
                });
                break;
            case 'cp':
                sortedPokemon.sort(function (a, b) {
                    if (a.cp > b.cp) return -1;
                    if (a.cp < b.cp) return 1;
                    return 0;
                });
                break;
            case 'iv':
                sortedPokemon.sort(function (a, b) {
                    if (a.iv > b.iv) return -1;
                    if (a.iv < b.iv) return 1;
                    return 0;
                });
                break;
            case 'time':
                sortedPokemon.sort(function (a, b) {
                    if (a.creation_time > b.creation_time) return -1;
                    if (a.creation_time < b.creation_time) return 1;
                    return 0;
                });
                break;
            default:
                sortedPokemon.sort(function (a, b) {
                    if (a.cp > b.cp) return -1;
                    if (a.cp < b.cp) return 1;
                    return 0;
                });
                break;
        }
        for (var i = 0; i < sortedPokemon.length; i++) {
            var pkmnNum = sortedPokemon[i].id,
                pkmnImage = self.pad_with_zeroes(pkmnNum, 3) + '.png',
                pkmnName = self.pokemonArray[pkmnNum - 1].Name,
                pkmnCP = sortedPokemon[i].cp,
                pkmnIV = sortedPokemon[i].iv,
                pkmnIVA = sortedPokemon[i].attack,
                pkmnIVD = sortedPokemon[i].defense,
                pkmnIVS = sortedPokemon[i].stamina,
                candyNum = self.getCandy(pkmnNum, userId);

            out += '<div class="col s12 m6 l3 center"><img src="image/pokemon/' +
                pkmnImage +
                '" class="png_img"><br><b>' +
                pkmnName +
                '</b><br>' +
                pkmnCP +
                '<br>IV: ' +
                pkmnIV +
                '<br>A/D/S:' +
                pkmnIVA + '/' + pkmnIVD + '/' + pkmnIVS +
                '<br>Candy: ' +
                candyNum +
                '</div>';
        }
        // Add number of eggs
        out += '<div class="col s12 m4 l3 center" style="float: left;"><img src="image/pokemon/Egg.png" class="png_img"><br><b>You have ' + eggs + ' egg' + (eggs !== 1 ? "s" : "") + '</div>';
        out += '</div></div>';
        var nth = 0;
        out = out.replace(/<\/div><div/g, function (match, i, original) {
            nth++;
            return (nth % 4 === 0) ? '</div></div><div class="row"><div' : match;
        });
        $('#subcontent').html(out);
    },

    sortAndShowPokedex: function (sortOn, userId) {
        var self = this,
            out = '',
            sortedPokedex = [],
            userId = (userId || 0),
            user = self.trainer_data[self.settings.users[userId]];

        if (!user.pokedex.length) return;

        out = '<div class="items"><div class="row">';
        for (var i = 0; i < user.pokedex.length; i++) {
            var pokedex_entry = user.pokedex[i].inventory_item_data.pokedex_entry,
                pkmID = pokedex_entry.pokemon_id,
                pkmnName = self.pokemonArray[pkmID - 1].Name,
                pkmEnc = pokedex_entry.times_encountered,
                pkmCap = pokedex_entry.times_captured;

            sortedPokedex.push({
                "name": pkmnName,
                "id": pkmID,
                "cap": (pkmCap || 0),
                "enc": (pkmEnc || 0)
            });
        }
        switch (sortOn) {
            case 'id':
                sortedPokedex.sort(function (a, b) {
                    return a.id - b.id;
                });
                break;
            case 'name':
                sortedPokedex.sort(function (a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                });
                break;
            case 'enc':
                sortedPokedex.sort(function (a, b) {
                    return a.enc - b.enc;
                });
                break;
            case 'cap':
                sortedPokedex.sort(function (a, b) {
                    return a.cap - b.cap;
                });
                break;
            default:
                sortedPokedex.sort(function (a, b) {
                    return a.id - b.id;
                });
                break;
        }
        for (var i = 0; i < sortedPokedex.length; i++) {
            var pkmnNum = sortedPokedex[i].id,
                pkmnImage = self.pad_with_zeroes(pkmnNum, 3) + '.png',
                pkmnName = self.pokemonArray[pkmnNum - 1].Name,
                pkmnName = self.pokemonArray[pkmnNum - 1].Name,
                pkmnEnc = sortedPokedex[i].enc,
                pkmnCap = sortedPokedex[i].cap,
                candyNum = self.getCandy(pkmnNum, userId);
            out += '<div class="col s12 m6 l3 center"><img src="image/pokemon/' +
                pkmnImage +
                '" class="png_img"><br><b> ' +
                self.pad_with_zeroes(pkmnNum, 3) +
                ' ' +
                pkmnName +
                '</b><br>Times Seen: ' +
                pkmnEnc +
                '<br>Times Caught: ' +
                pkmnCap +
                '<br>Candy: ' +
                candyNum +
                '</div>';
        }
        out += '</div></div>';
        var nth = 0;
        out = out.replace(/<\/div><div/g, function (match, i, original) {
            nth++;
            return (nth % 4 === 0) ? '</div></div><div class="row"><div' : match;
        });
        $('#subcontent').html(out);
    },

    loadJSON: function (path, success, error, successData) {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    if (success)
                        success(JSON.parse(xhr.responseText.replace(/\bNaN\b/g, 'null')), successData);
                } else {
                    if (error)
                        error(xhr);
                }
            }
        };

        xhr.open('GET', path, true);
        xhr.send();
    },

    errorFunc: function (xhr) {
        console.error(xhr);
        self.log({
            message: xhr,
            color: "red-text"
        });
    },

    // Adds events to log panel and if it's closed sends Toast
    log: function (log_object) {
        var currentDate = new Date(),
            time = ('0' + currentDate.getHours()).slice(-2) + ':' + ('0' + (currentDate.getMinutes())).slice(-2);

        $("#logs-panel .card-content").append("<div class='log-item'>\
  <span class='log-date'>" + time + "</span><p class='" + log_object.color + "'>" + log_object.message + "</p></div>");

        if (!$('#logs-panel').is(":visible")) {
            Materialize.toast(log_object.message, 3000);
        }
    }
};

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}
