'use strict';

$(document).ready(function () {
    trainerToolsView.init();
});

var trainerToolsView = {
    teams: [
        {
            name: 'TeamLess',
            color: 'grey',
            colorVariant: 'darken-2'
        },
        {
            name: 'Mystic',
            color: 'blue',
            colorVariant: 'darken-3'
        },
        {
            name: 'Valor',
            color: 'red',
            colorVariant: 'darken-3'
        },
        {
            name: 'Instinct',
            color: 'yellow',
            colorVariant: 'darken-3'
        }
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
    trainerId: 0,
    pokemonArray: {},
    pokemoncandyArray: {},
    itemsArray: {},
    trainer_data: {},
    settings: {},

    init: function () {
        var self = this;

        self.settings = $.extend(true, self.settings, trainersInfo);

        self.bindUI();

        self.log({
            message: 'Loading game data...',
            color: "blue-text"
        });

        var pokemonsJsonFile = 'data/pokemons.json';
        self.loadJSON(pokemonsJsonFile, function (data) {
            self.pokemonArray = data;
        }, self.errorFunc, 'Failed to load \'' + pokemonsJsonFile + '\' file');

        var candiesJsonFile = 'data/candies.json';
        self.loadJSON(candiesJsonFile, function (data) {
            self.pokemoncandyArray = data;
        }, self.errorFunc, 'Failed to load \'' + candiesJsonFile + '\' file');

        var itemsJsonFile = 'data/items.json';
        self.loadJSON(itemsJsonFile, function (data) {
            self.itemsArray = data;
        }, self.errorFunc, 'Failed to load \'' + itemsJsonFile + '\' file');

        self.log({
            message: 'Game data Loaded !',
            color: "green-text"
        });

        for (var i = 0; i < self.settings.trainers.length; i++) {
            var trainerName = self.settings.trainers[i];
            self.trainer_data[trainerName] = {};
        }

        self.initView();
    },

    bindUI: function () {
        var self = this;

        var body = $('body');

        $('#logs-button').click(function () {
            $('#logs-panel').toggle();
        });
        // Init tooltip
        $(document).ready(function () {
            $('.tooltipped').tooltip({
                delay: 50
            });
        });

        // Close section menu on clic everywhere
        body.click(function (e) {
            var fab = $('#section-button');
            if (fab.hasClass('active')) {
                fab.closeFAB();
                e.stopPropagation();
            }
        });

        // Build content view when an item is selected
        body.on('click', "#section-button .btn-section", function () {
            var self = trainerToolsView,
                sectionTarget = $(this).data('section-target'),
                trainerName = self.settings.trainers[self.trainerId];

            self.showContent(sectionTarget);
        });

        body.on('click', '.close', function () {
            $('#content').toggle();
        });

        // Binding sorts
        body.on('click', '.pokemon-sort a', function () {
            var item = $(this);
            self.sortAndShowBagPokemon(item.data('sort'), item.parent().parent().data('user-id'));
        });
        body.on('click', '.pokedex-sort a', function () {
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

        if (self.settings.trainers.length >= 1) {
            self.log({
                message: "Starting to load trainers data...",
                color: "blue-text"
            });

            for (var i = 0; i < self.settings.trainers.length; i++) {
                self.loadJSON('inventory-' + self.settings.trainers[i] + '.json', self.getInventoryData, self.errorFunc, i);
                self.loadJSON('player-' + self.settings.trainers[i] + '.json', self.getPlayerData, self.errorFunc, i);
                self.loadJSON('settings-' + self.settings.trainers[i] + '.json', self.getSettingsData, self.errorFunc, i);

                self.log({
                    message: self.settings.trainers[i] + " data loaded !",
                    color: "green-text"
                }, true, 'green');
            }
        } else {
            self.log({
                message: "Error: no setting was found for trainer in config/trainersdata.js",
                color: "red-text"
            }, true, 'red');

            //TODO : Display something when there is no trainer configured in trainersdata.js
        }
    },

    getInventoryData: function (data, trainerIndex) {
        var self = trainerToolsView,
            trainerData = self.trainer_data[self.settings.trainers[trainerIndex]];

        trainerData.bagCandy = self.filterInventory(data, 'candy');
        trainerData.bagItems = self.filterInventory(data, 'item');
        trainerData.bagPokemon = self.filterInventory(data, 'pokemon_data');
        trainerData.pokedex = self.filterInventory(data, 'pokedex_entry');
        trainerData.stats = self.filterInventory(data, 'player_stats');

        self.trainer_data[self.settings.trainers[trainerIndex]] = trainerData;
    },

    getPlayerData: function (data, trainerIndex) {
        var self = trainerToolsView,
            trainerData = self.trainer_data[self.settings.trainers[trainerIndex]];

        trainerData.player = data;

        self.trainer_data[self.settings.trainers[trainerIndex]] = trainerData;

        if (trainerIndex + 1 === self.settings.trainers.length) {
            self.buildTrainersListMenu();
        }
    },

    getSettingsData: function (data, trainerIndex) {
        var self = trainerToolsView,
            trainerData = self.trainer_data[self.settings.trainers[trainerIndex]];

        trainerData.settings = data;

        self.trainer_data[self.settings.trainers[trainerIndex]] = trainerData;
    },

    buildTrainersListMenu: function () {
        var self = this,
            trainers = self.settings.trainers,
            navContainer = $('#nav-mobile'),
            trainerList = $('#trainers-list'),
            dropDownMenu = navContainer.find('.dropdown-button'),
            aloneMenu = navContainer.find('.alone-button'),
            out = '';

        if (trainers.length > 1) {
            for (var i = 0; i < trainers.length; i++) {
                var content = '<li><a href="#" class="trainer black-text" data-trainer-id="' + i + '">{0}</a></li>';
                out += content.format(trainers[i]);
            }
            trainerList.html(out);

            // Bind event when user select a trainer
            trainerList.on('click', '.trainer', function () {
                self.trainerId = $(this).data('trainer-id');

                var trainerName = trainers[self.trainerId];

                // Display trainer name in dropdown title
                $('#nav-mobile').find('.dropdown-title').html(trainerName);

                // Apply team color
                self.applyTrainerTeamColor(trainerName);

                // Show section menu
                $('#section-button').removeClass('hide');

                // Build content card
                self.buildAllContents(trainerName)
            });

            aloneMenu.addClass('hide');
            dropDownMenu.removeClass('hide');
        } else if (trainers.length === 1) {
            out = trainers[0];
            aloneMenu.html(out);

            // Simulate trainer selection
            self.trainerId = 0;
            var trainerName = trainers[self.trainerId];

            // Apply team color
            self.applyTrainerTeamColor(trainerName);

            // Show section menu
            $('#section-button').removeClass('hide');

            // Build content card
            self.buildAllContents(trainerName)
        }
    },

    applyTrainerTeamColor: function (trainerName) {
        var self = this,
            teams = self.teams,
            trainerTeam = self.teams[self.getTeam(trainerName)];

        // Change color for nav bar
        var navContainer = $('#nav-wrapper');
        navContainer.removeClass('black');
        for (var i = 0; i < teams.length; i++) {
            navContainer.removeClass(teams[i].color);
            if (teams[i].colorVariant !== '') {
                navContainer.removeClass(teams[i].colorVariant);
            }
        }
        navContainer.addClass(trainerTeam.color);
        navContainer.addClass(trainerTeam.colorVariant);

        // Change color for logs button
        var logButton = $('#logs-button');
        logButton.removeClass('black');
        for (var i = 0; i < teams.length; i++) {
            logButton.removeClass(teams[i].color);
            if (teams[i].colorVariant !== '') {
                logButton.removeClass(teams[i].colorVariant);
            }
        }
        logButton.addClass(trainerTeam.color);
        logButton.addClass(trainerTeam.colorVariant);

        // Change color for section button elements
        var sectionButton = $('#section-button');
        sectionButton.find('.btn-floating').each(function () {
            for (var i = 0; i < teams.length; i++) {
                $(this).removeClass(teams[i].color);
                if (teams[i].colorVariant !== '') {
                    $(this).removeClass(teams[i].colorVariant);
                }
            }
            $(this).addClass(trainerTeam.color);
            $(this).addClass(trainerTeam.colorVariant);
        });
    },

    buildAllContents: function (trainerName) {
        var self = this;

        // Build info card
        self.buildInfosContent(trainerName);

        // Build pokemon card
        self.buildPokemonContent(trainerName);

        // Build pokedex card
        self.buildPokedexContent(trainerName);

        // Build item card
        self.buildItemContent(trainerName);
    },

    buildInfosContent: function (trainerName) {
        var self = this,
            container = $('article.content[data-section="info"]'),
            currentTrainerStats = self.trainer_data[trainerName].stats[0].inventory_item_data.player_stats,
            playerInfo = self.trainer_data[trainerName].player,
            team = self.getTeam(trainerName),
            out;

        container.find('.subtitle').html('Trainer Infos');

        out = '<div class="row">' +
            '<div class="col s12">' +
            '<ul class="collection with-header">' +
            '<li class="collection-header"><h5 class="center">' + playerInfo.username + ' (' + currentTrainerStats.level + ')</h5></li>' +
            '<li class="collection-header"><div class="progress teambar-' + team + '" style="height: 10px">' +
            '<div class="determinate team-' + team + '" style="width: ' +
            (currentTrainerStats.experience / currentTrainerStats.next_level_xp) * 100 + '%">' +
            '</div>' +
            '</div></li>' +
            '<li class="collection-item">Start to play: ' + self.timeConverter(playerInfo.creation_timestamp_ms) +
            (parseInt(currentTrainerStats.next_level_xp, 10) - currentTrainerStats.experience) + ')</li>' +
            '<li class="collection-item">Stardust: ' + (parseFloat(playerInfo.currencies[1].amount) || 0) + '</li>' +
            '<li class="collection-item">Pokecoin: ' + (parseFloat(playerInfo.currencies[0].amount) || 0) + '</li>' +
            '<li class="collection-item">Exp: ' + currentTrainerStats.experience + ' (to next level: ' +
            '<li class="collection-item">Kilometers walked: ' + (parseFloat(currentTrainerStats.km_walked).toFixed(3) || 0) + '</li>' +
            '<li class="collection-item">Pokemon encountered: ' + (currentTrainerStats.pokemons_encountered || 0) + '</li>' +
            '<li class="collection-item">Pokeballs thrown: ' + (currentTrainerStats.pokeballs_thrown || 0) + '</li>' +
            '<li class="collection-item">Pokemon caught: ' + (currentTrainerStats.pokemons_captured || 0) + '</li>' +
            '<li class="collection-item">Pokemon evolved: ' + (currentTrainerStats.evolutions || 0) + '</li>' +
            '<li class="collection-item">Eggs hatched: ' + (currentTrainerStats.eggs_hatched || 0) + '</li>' +
            '<li class="collection-item">Unique pokedex entries: ' + (currentTrainerStats.unique_pokedex_entries || 0) + '</li>' +
            '<li class="collection-item">PokeStops visited: ' + (currentTrainerStats.poke_stop_visits || 0) + '</li>' +
            '<li class="collection-item">Gym attacks won/total: ' + (currentTrainerStats.battle_attack_won || 0) + '/' +
            (currentTrainerStats.battle_attack_total || 0) + '</li>' +
            '<li class="collection-item">Gym training won/total: ' + (currentTrainerStats.battle_training_won || 0) + '/' +
            (currentTrainerStats.battle_training_total || 0) + '</li>' +
            '<li class="collection-item">Prestige raised: ' + (currentTrainerStats.prestige_raised_total || 0) + '</li>' +
            '<li class="collection-item">Prestige dropped: ' + (currentTrainerStats.prestige_dropped_total || 0) + '</li>' +
            '<li class="collection-item">Big magikarp caught: ' + (currentTrainerStats.big_magikarp_caught || 0) + '</li>' +
            '<li class="collection-item">Small rattata caught: ' + (currentTrainerStats.small_rattata_caught || 0) + '</li>' +
            '</ul>' +
            '</div>' +
            '</div>';

        container.find('.subcontent').html(out);
    },

    buildPokemonContent: function (trainerName) {
        var self = this,
            container = $('article.content[data-section="pokemon"]');

        var pkmnTotal = self.trainer_data[trainerName].bagPokemon.length;
        container.find('.subtitle').html(pkmnTotal + " Pokemon");

        var sortButtons = '<div class="col s12 pokemon-sort" data-user-id="' + trainerName + '">Sort : ';
        sortButtons += '<div class="chip"><a href="#" data-sort="cp">CP</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="iv">IV</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="name">Name</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="id">ID</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="time">Time</a></div>';
        sortButtons += '</div>';
        container.find('.sort-buttons').html(sortButtons);

        var pokemonList = self.sortAndShowBagPokemon('cp', trainerName);
        container.find('.subcontent').html(pokemonList);
    },

    buildPokedexContent: function (trainerName) {
        var self = this,
            container = $('article.content[data-section="pokedex"]');

        var pkmnTotal = self.trainer_data[trainerName].pokedex.length;
        container.find('.subtitle').html('Pokedex ' + pkmnTotal + ' / 151');

        var sortButtons = '<div class="col s12 pokedex-sort" dat-user-id="' + trainerName + '">Sort : ';
        sortButtons += '<div class="chip"><a href="#" data-sort="id">ID</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="name">Name</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="enc">Seen</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="cap">Caught</a></div>';
        sortButtons += '</div>';
        container.find('.sort-buttons').html(sortButtons);

        var pokemonList = self.sortAndShowPokedex('id', trainerName);
        container.find('.subcontent').html(pokemonList);
    },

    buildItemContent: function (trainerName) {
        var self = this,
            container = $('article.content[data-section="item"]'),
            out;

        var currentTrainerItems = self.trainer_data[trainerName].bagItems;
        container.find('.subtitle').html(currentTrainerItems.length + " item" + (currentTrainerItems.length !== 1 ? "s" : "") + " in Bag");

        out = '<div class="items"><div class="row">';
        for (var i = 0; i < currentTrainerItems.length; i++) {
            out += '<div class="col s12 m6 l3 center" style="float: left"><img src="image/items/' +
                currentTrainerItems[i].inventory_item_data.item.item_id +
                '.png" class="item_img"><br><b>' +
                self.itemsArray[currentTrainerItems[i].inventory_item_data.item.item_id] +
                '</b><br>Count: ' +
                (currentTrainerItems[i].inventory_item_data.item.count || 0) +
                '</div>';
        }
        out += '</div></div>';
        var nth = 0;
        out = out.replace(/<\/div><div/g, function (match, i, original) {
            nth++;
            return (nth % 4 === 0) ? '</div></div><div class="row"><div' : match;
        });
        container.find('.subcontent').html(out);
    },

    showContent: function (sectionTarget) {
        // Hides all contents
        $("article.content").addClass('hide');

        // Show target content
        $("article.content[data-section=" + sectionTarget + "]").removeClass('hide');

        $('#content').show();
    },

    timeConverter: function (timestamp) {
        var datetime = new Date(timestamp);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = datetime.getFullYear();
        var month = months[datetime.getMonth()];
        var date = datetime.getDate();
        var hour = datetime.getHours();
        var min = datetime.getMinutes() < 10 ? '0' + datetime.getMinutes() : datetime.getMinutes();
        var sec = datetime.getSeconds() < 10 ? '0' + datetime.getSeconds() : datetime.getSeconds();
        return date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
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

    getCandy: function (p_num, trainer) {
        var self = this;

        for (var i = 0; i < trainer.bagCandy.length; i++) {
            var checkCandy = trainer.bagCandy[i].inventory_item_data.candy.family_id;
            if (self.pokemoncandyArray[p_num] === checkCandy) {
                return (trainer.bagCandy[i].inventory_item_data.candy.candy || 0);
            }
        }
    },

    getTeam: function (trainerName) {
        var self = this,
            playerInfo = self.trainer_data[trainerName].player;

        if (playerInfo && typeof playerInfo !== 'undefined' && playerInfo.length !== 0) {
            return playerInfo.team;
        } else {
            self.log({
                message: 'No team was found for ' + trainerName + '.',
                color: "red-text"
            });
            return 0
        }
    },

    addMissingZero: function (number, length) {
        var my_string = '' + number;

        while (my_string.length < length) {
            my_string = '0' + my_string;
        }
        return my_string;
    },

    sortAndShowBagPokemon: function (sortOn, trainerName) {
        var self = this,
            eggs = 0,
            sortedPokemon = [],
            out = '',
            trainer = self.trainer_data[trainerName];

        if (!trainer.bagPokemon.length) return;

        out = '<div class="items"><div class="row">';
        for (var i = 0; i < trainer.bagPokemon.length; i++) {
            if (trainer.bagPokemon[i].inventory_item_data.pokemon_data.is_egg) {
                eggs++;
                continue;
            }
            var pokemonData = trainer.bagPokemon[i].inventory_item_data.pokemon_data,
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
                pkmnImage = self.addMissingZero(pkmnNum, 3) + '.png',
                pkmnName = self.pokemonArray[pkmnNum - 1].Name,
                pkmnCP = sortedPokemon[i].cp,
                pkmnIV = sortedPokemon[i].iv,
                pkmnIVA = sortedPokemon[i].attack,
                pkmnIVD = sortedPokemon[i].defense,
                pkmnIVS = sortedPokemon[i].stamina,
                candyNum = self.getCandy(pkmnNum, trainer);

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

        return out;
    },

    sortAndShowPokedex: function (sortOn, trainerName) {
        var self = this,
            out = '',
            sortedPokedex = [],
            trainer = self.trainer_data[trainerName];

        if (!trainer.pokedex.length) return;

        out = '<div class="items"><div class="row">';
        for (var i = 0; i < trainer.pokedex.length; i++) {
            var pokedex_entry = trainer.pokedex[i].inventory_item_data.pokedex_entry,
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
                pkmnImage = self.addMissingZero(pkmnNum, 3) + '.png',
                pkmnName = self.pokemonArray[pkmnNum - 1].Name,
                pkmnName = self.pokemonArray[pkmnNum - 1].Name,
                pkmnEnc = sortedPokedex[i].enc,
                pkmnCap = sortedPokedex[i].cap,
                candyNum = self.getCandy(pkmnNum, trainer);
            out += '<div class="col s12 m6 l3 center"><img src="image/pokemon/' +
                pkmnImage +
                '" class="png_img"><br><b> ' +
                self.addMissingZero(pkmnNum, 3) +
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

        return out;
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
    log: function (log, onToast, toastClass) {
        var currentDate = new Date(),
            time = ('0' + currentDate.getHours()).slice(-2) + ':' + ('0' + (currentDate.getMinutes())).slice(-2) + ':' + currentDate.getSeconds();

        $("#logs-panel .card-content").append("<div class='log-item'>\
      <span class='log-date'>" + time + " - </span><span class='" + log.color + "'>" + log.message + "</span></div>");

        if (onToast && !$('#logs-panel').is(":visible")) {
            var toastDesign = 'rounded';
            if (toastClass && toastClass !== '') {
                toastDesign += ' ' + toastClass;
            }
            Materialize.toast(log.message, 1500, toastDesign);
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
