App = {
  web3Provider: null,
  contracts: {},
	
  init: function() {
    // Load info.
    $.getJSON('../real-estate.json', function(data) {
      var row = $('#list');
      var template = $('#template');

      for (i = 0; i < data.length; i++) {
        template.find('.panel-title').text(data[i].name);
				template.find('img').attr('src', data[i].picture);
				template.find('.number').text(data[i].id);
        template.find('.type').text(data[i].type);
        template.find('.area').text(data[i].area);
        template.find('.price').text(data[i].price);
        template.find('.btn-buy').attr('data-id', data[i].id);
				template.find('.btn-buyerInfo').attr('data-id', data[i].id);

        row.append(template.html());
      }
    });
    return App.initWeb3();
  },

  initWeb3: function() {
	if (typeof web3 !== 'undefined') {
		App.web3Provider = web3.currentProvider;
		web3 = new Web3(web3.currentProvider);
	} else {
		App.web3Provider = new web3.providers.HttpProvider('http://localhost:8445');
		web3 = new Web3(App.web3Provider);
	}
    return App.initContract();
  },

  initContract: function() {
		$.getJSON('RealEstate.json', function(data) {
			//get the necessary contract artifact file and instnatiate it with truffle-contract.
			var RealEstateArtifact = data;
			App.contracts.RealEstate = TruffleContract(RealEstateArtifact);

			//set the provider for our contract.
			App.contracts.RealEstate.setProvider(App.web3Provider);
			// listen to events
			App.listenToEvents();
			//user our contract to retrieve and mark the adopted pets.
			return App.loadRealEstates();
		});
  },

	buyRealEstate: function() {	
		web3.eth.getAccounts(function(error, accounts) {
			if (error) {
				console.log(error);
			}			

			var account = accounts[0];
			var id = $('#id').val();		
			var price = $('#price').val();
			var name = $('#name').val();			
			var age = $('#age').val();
			var nameUtf8Encoded = utf8.encode(name);

			App.contracts.RealEstate.deployed().then(function(instance) {
				return instance.buyRealEstate(id, web3.toHex(nameUtf8Encoded), age, { from: account, value: price });
			}).then(function() {
				return App.loadRealEstates();
			}).catch(function(err) {
				console.log(err.message);
			});
		});	
	},

  loadRealEstates: function() {
		App.contracts.RealEstate.deployed().then(function(instance) {
			return instance.getAllBuyers.call();
		}).then(function(allBuyers) {
			for (i = 0; i < allBuyers.length; i++) {	
				if (allBuyers[i] !== '0x0000000000000000000000000000000000000000') {				
					var imgType = $('.panel-realEstate').eq(i).find('img').attr('src').substr(7);	

					switch(imgType) {
						case 'apartment.jpg':
						  $('.panel-realEstate').eq(i).find('img').attr('src', 'images/apartment_sold.jpg')	
						  break;
						case 'townhouse.jpg':
					  	$('.panel-realEstate').eq(i).find('img').attr('src', 'images/townhouse_sold.jpg')	
						  break;
						case 'house.jpg':
						  $('.panel-realEstate').eq(i).find('img').attr('src', 'images/house_sold.jpg')	
						  break;					
					 } 		
					 
					$('.panel-realEstate').eq(i).find('.btn-buy').text('매각').attr('disabled', true);		
					$('.panel-realEstate').eq(i).find('.btn-buyerInfo').removeAttr('style');	
				} 
			}
		}).catch(function(err) {
			console.log(err.message);
		});
	},
	
	listenToEvents: function() {
		App.contracts.RealEstate.deployed().then(function(instance) {
			instance.LogBuyRealEstate({},{}).watch(function(error, event) {
				if (!error) {
					notif({
            msg: '<strong>' + event.args._buyer + '</strong>' + ' 님이 ' + event.args._id + ' 번 매물을 매입했습니다.',
            type: "info",
            multiline: true,
            position: 'bottom',
            timeout: 5000
        	});			
				} else {
					console.error(error);
				}
				App.loadRealEstates();
			})
		})
	}
};

$(function() {
  $(window).load(function() {
    App.init();
	});
	
	$('#buy').on('show.bs.modal', function(e) {
		var id = $(e.relatedTarget).data('id');
		var price = web3.toWei(parseFloat($(e.relatedTarget).parent().find('.price').text() || 0), "ether");	
		$(e.currentTarget).find('#id').val(id);
		$(e.currentTarget).find('#price').val(price);
	});

	$('#buyerInfo').on('show.bs.modal', function(e) {
		var id = $(e.relatedTarget).data('id');
		App.contracts.RealEstate.deployed().then(function(instance) {					
			return instance.getBuyerInfo.call(id);
		}).then(function(buyerInfo) {
		$(e.currentTarget).find('#buyerAddress').text(buyerInfo[0]);
		$(e.currentTarget).find('#buyerName').text(web3.toUtf8(buyerInfo[1]));
		$(e.currentTarget).find('#buyerAge').text(buyerInfo[2]);
		}).catch(function(err) {
			console.log(err.message);
		});		
	});

	// 모달 form input 필드 클리어 
	$('#buy').on('hidden.bs.modal', function () {
    $(this).find('form').trigger('reset');
	})
});
