
//var Scope		= null
var RequestNum	= {};
var DigestUpdate = 0;
var ServerTypes = {};
var FirstTime = true;

function ControllerServers( $scope, $element, $rootScope, $location )
{
	console.log("LOAD SERVER CONTROLLER!");

	$scope.ShowTab = 'internet';
	$scope.Refreshing = {};
	
	// WHAT IS DIFF BETWEEN ShowTab AND ServerType???

	$scope.DoStopRefresh = function()
	{
		lua.Run( "DoStopServers( '" + $scope.ServerType + "' )" );
	}

	$scope.Refresh = function()
	{
		if ( !$scope.ServerType ) return;

		if ( !RequestNum[ $scope.ServerType ] )
			RequestNum[ $scope.ServerType ] = 1;
		else
			RequestNum[ $scope.ServerType ]++;

		//
		// Clear out all of the servers
		//
		ServerTypes[$scope.ServerType].servers.length = 0;
		
		if ( !IN_ENGINE ) // TODO fix the tests I guess
			TestUpdateServers( $scope.ServerType, RequestNum[ $scope.ServerType ] );

		//
		// Get the server list from the engine
		//
		lua.Run( "GetServers( '"+$scope.ServerType+"', '"+RequestNum[$scope.ServerType ]+"' )" );

		$scope.Refreshing[$scope.ServerType] = "true";
		UpdateDigest( $rootScope, 50 ); //always call this with ROOT SCOPE
	}

	$scope.SelectServer = function( server )
	{
		$scope.SelectedServer = server;

		if ( !IN_ENGINE ) //TODO make sure this still works!
			SetPlayerList( server.address, { "1": { "time": 3037.74, "score": 5, "name": "Sethxi" }, "2": { "time": 2029.34, "score": 0, "name": "RedDragon124" }, "3": { "time": 1405.02, "score": 0, "name": "Joke (0_0)" }, "4": { "time": 462.15, "score": 0, "name": "TheAimBot" }, "5": { "time": 301.32, "score": 0, "name": "DesanPL"} } );

		lua.Run( "GetPlayerList( '"+server.address+"' )" );
		
		if ( server.DoubleClick )
		{
			$scope.JoinServer( server ); //TODO make sure this works!
			return;
		}

		//
		// ng-dblclick doesn't work properly in engine, so we fake it!
		//
		server.DoubleClick = true;

		setTimeout( function()
		{
			server.DoubleClick = false;
		}, 500 )
	}
	/*
	$scope.SelectGamemode = function( gm )
	{
		Scope.CurrentGamemode = gm;
	}*/
	
	// These two are helpers for CSS classes... I think...	
	$scope.ServerClass = function( sv )
	{
		var tags = "";

		if ( !sv.hasmap ) tags += " missingmap ";
		if ( sv.players == 0 ) tags += " empty ";

		return tags;
	}

	$scope.ServerRank = function( sv )
	{
		if ( sv.recommended < 50 )	return "rank5";
		if ( sv.recommended < 100 )	return "rank4";
		if ( sv.recommended < 200 )	return "rank3";
		if ( sv.recommended < 300 )	return "rank2";
		return "rank1";
	}

	$scope.ChangeOrder = function( gm, order )
	{
		if ( $scope.OrderServersByMain == order )
		{
			$scope.OrderServersReverse = !$scope.OrderServersReverse;
			return;
		}

		$scope.OrderServersByMain = order;
		$scope.OrderServersBy = [order, 'recommended', 'ping', 'address'];
		$scope.OrderServersReverse = false;

		//console.log(gm.OrderBy[0]);
	}
	
	// Another helper?
	/*$scope.GamemodeName = function( gm )
	{
		if ( !gm ) return "Unknown Gamemode";

		if ( gm.info && gm.info.title )
			return gm.info.title;

		return gm.name;
	}*/
	
	// plz do something about this.
	$scope.JoinServer = function ( server )
	{
		if ( server.password )
			lua.Run( "RunConsoleCommand( \"password\", \""+server.password+"\" )" )

		lua.Run( "JoinServer( \""+server.address+"\" )" )
	}

	$scope.SwitchType = function( type )
	{
		if ( $scope.ServerType == type ) return;

		var FirstTime = false;
		if ( !ServerTypes[type] )
		{
			ServerTypes[type] = 
			{
				//TODO shitcan both of these -Parakeet				
				servers: []
			};

			FirstTime = true;
		}

		$scope.ServerType		= type;
		//Scope.Gamemodes			= ServerTypes[type].gamemodes;
		//Scope.GamemodeList		= ServerTypes[type].list

		//ADDED -Parakeet
		$scope.Servers = ServerTypes[type].servers;


		if ( FirstTime )
		{
			$scope.Refresh();
		}
	}

	/* This is stupid.
	$scope.InstallGamemode = function( gm )
	{
		lua.Run( "steamworks.Subscribe( %s )", String( gm.info.workshopid ) );
	}*/

	/* Ditto.
	$scope.ShouldShowInstall = function( gm )
	{
		if ( !gm ) return false;
		if ( !gm.info ) return false;
		if ( !gm.info.workshopid ) return false;
		if ( gm.info.workshopid == "" ) return false;
		if ( subscriptions.Contains( String(gm.info.workshopid) ) ) return false;

		return true;
	}*/

	$rootScope.ShowBack = true;

	if ( FirstTime )
	{
		FirstTime = false;
		$scope.SwitchType( 'internet' );
	}

	$scope.OrderServersByMain = 'recommended';
	$scope.OrderServersBy = ['recommended', 'ping', 'address'];
	$scope.OrderServersReverse = false;

	// CALLBACKS BE HERE! WE PUT THEM IN THIS CLOSURE SO WE CAN ACCESS THE SCOPES WITHOUT THINGS GETTING ALL RETARDED!

	function FinishedServeres( type )
	{
		$scope.Refreshing[type] = "false";
		UpdateDigest( $rootscope, 50 );
	}

	/*function GetGamemode( name, type )
	{
		if ( !ServerTypes[type] ) return;

		if ( ServerTypes[type].gamemodes[name] ) return ServerTypes[type].gamemodes[name]

		ServerTypes[type].gamemodes[name] = 
		{
			name:			name,
			servers:		[],
			num_servers:	0,
			num_players:	0,
			OrderByMain:	'recommended',
			OrderBy:		['recommended', 'ping', 'address'],
			info:			GetGamemodeInfo( name )
		};

		ServerTypes[type].list.push( ServerTypes[type].gamemodes[name] )

		return ServerTypes[type].gamemodes[name];
	}*/

	window.AddServer = function( type, id, ping, name, desc, map, players, maxplayers, botplayers, pass, lastplayed, address, gamemode, workshopid )
	{
		// Make sure this addition is part of our current refresh cycle. I do not like this. -Parakeet
		if ( id != RequestNum[ type ] ) return;

		if ( !gamemode ) gamemode = desc; // wtf? -Parakeet
		if ( maxplayers <= 1 ) return; // the hell? TODO validate lua-side -Parakeet

		var data =
		{
			ping:			parseInt( ping ),
			name:			name,
			desc:			desc,
			map:			map,
			players:		parseInt( players ) - parseInt( botplayers ),
			maxplayers:		parseInt( maxplayers ),
			botplayers:		parseInt( botplayers ),
			pass:			pass, // TODO this is a retarded name -Parakeet
			lastplayed:		parseInt( lastplayed ),
			address:		address,
			gamemode:		gamemode,
			password:		'', // Does this really need to be here? Maybe?!?
			workshopid:		workshopid
		};

		data.hasmap = DoWeHaveMap( data.map );
		
		// Not sure if I want to keep these ratings or not. If we keep it I want to make the indicator smaller. The bar is dumb. -Parakeet
		data.recommended = data.ping;
		if ( !data.hasmap ) data.recommended += 20; // We don't have that map -- Is this really a good idea? Content downloads are usually a much bigger issue than the damn map. -Parakeet
		if ( data.players == 0 ) data.recommended += 100; // Server is empty
		if ( data.players == data.maxplayers ) data.recommended += 75; // Server is full
		if ( data.pass ) data.recommended += 300; // If we can't join it, don't put it to the top

		data.listen = data.desc.indexOf('[L]') >= 0;
		if ( data.listen ) data.desc = data.desc.substr( 4 );

		//var gm = GetGamemode( data.gamemode, type );
		//gm.servers.push( data );
		
		ServerTypes[type].servers.push(data);


		//UpdateGamemodeInfo( data )

		//gm.num_servers += 1; DUMB -Parakeet
		
		//gm.num_players += data.players LESS DUMB, Maybe track this somewhere else... -Parakeet

		// Meh.
		//gm.element_class = "";
		//if ( gm.num_players == 0 ) gm.element_class = "noplayers";
		//if ( gm.num_players > 50 ) gm.element_class = "lotsofplayers";

		//gm.order = gm.num_players + Math.random();

		UpdateDigest( $rootScope, 1000 ); // update slower than usual
	}

	/*function MissingGamemodeIcon( element )
	{
		element.src = "../gamemodes/base/icon24.png";
		return true;
	}*/

	function SetPlayerList( serverip, players )
	{
		if ( !$scope.SelectedServer ) return;
		if ( $scope.SelectedServer.address != serverip ) return;

		$scope.SelectedServer.playerlist = players

		UpdateDigest( $rootscope, 50 );
	}
}
