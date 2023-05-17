let allPokemons = [];
let selected_pokemons = [];
let selectedTypes = [];

let totalPokemon = 65;
const POKEMON_PER_PAGE = 10;
const maxPageButtons = 5;
let currentPage = 1;
let totalPage = 0;

//get all pokemons, calc total page, display one and its content!
const setup = async () => {
    $('#pokemonList').empty();
    displayFilterForm();

    let response = await axios.get(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=${totalPokemon}`);
    allPokemons = response.data.results;
    
    paginate(currentPage, POKEMON_PER_PAGE, allPokemons);
    updatePaginationDiv(currentPage, allPokemons);

    $('body').on('click', '.pokeCard', async function (e) { 
        const pokemonName = $(this).attr('pokeName');
        const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)

        $('.modal-body').html(`
            <div style="width:200px">
                <img src="${res.data.sprites.other['official-artwork'].front_default}" 
                    alt="${res.data.name}"/>
                <div>
                    <h3> Types </h3>
                    <ul> ${res.data.types.map((type) => 
                        `<li>${type.type.name}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h3> Abilities </h3>
                    <ul> ${res.data.abilities.map((ability) => 
                        `<li>${ability.ability.name}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h3> Stats </h3>
                    <ul> ${res.data.stats.map((stat) => 
                        `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
                    </ul>
                </div>
            </div>      
        `)
        $('.modal-title').html(`
            <h2> ${res.data.name.toUpperCase()} </h2>
            <h5> Pokedex: ${res.data.id} </h5>
        `)
    })

    //make the buttons responses and report accordingly!
    $('body').on('click', '.numberedButtons, .previous, .next, .pokeType', 
    async function(e) {
        if ($(this).hasClass('numberedButtons')) {
            currentPage = Number(e.target.value);
        } else if ($(this).hasClass('previous')) {
            currentPage = currentPage - 1;
        } else if ($(this).hasClass('next')) {
            currentPage = currentPage + 1;
        } else if ($(this).hasClass('pokeType')) {
            if (!selectedTypes.includes(Number(e.target.value))) {
                selectedTypes.push(Number(e.target.value));
                console.log("Added filter type: ", e.target.value,
                "; type list: ", selectedTypes);
                await filterPokemon(selectedTypes);
            } else {    
                selectedTypes = selectedTypes.filter(value => value !== Number(e.target.value));
                console.log("Removed filter type: ", e.target.value,
                "; type list: ", selectedTypes);
                await filterPokemon(selectedTypes);
            }
        }
        paginate(currentPage, POKEMON_PER_PAGE, allPokemons);
        updatePaginationDiv(currentPage, allPokemons);
        console.log("Current page: " + currentPage);
        console.log("total page: " + totalPage);
    });
}

//slice out 10 pokemons from parameter, take each and append them in!
const paginate = async (currentPage, POKEMON_PER_PAGE, allPokemons) => {
    selected_pokemons = allPokemons.slice((currentPage - 1) * POKEMON_PER_PAGE, currentPage * POKEMON_PER_PAGE);

    $('#pokemonList').empty();
    selected_pokemons.forEach(async (pokemon) => {
        const res = await axios.get(pokemon.url);
        $('#pokemonList').append(`
            <div class="pokeCard card" pokeName=${res.data.name}>
                <h3> ${res.data.name.toUpperCase()}</h3>
                <img src="${res.data.sprites.front_default}" 
                    alt="${res.data.name}"/>
                <button type="button" class="btn btn-primary" 
                data-toggle="modal" data-target="#pokemonModal">
                    More
                </button>
            </div>
        `)
    })
    $('#outOfHowMany').html(`
        <h1> Viewing ${selected_pokemons.length + (POKEMON_PER_PAGE * (currentPage - 1))} 
            out of ${allPokemons.length}
        </h1>
    `)
}

//update and show how many pages are there in the pagination!
const updatePaginationDiv = (currentPage, allPokemons) => {
    $('#pagination').empty();
    totalPage = Math.ceil(allPokemons.length / POKEMON_PER_PAGE);

    if (currentPage > 1) {
        $('#pagination').append(`
        <button class="btn btn-primary page ml-1 previous">
            Previous
        </button>
        `)
    }
    for (let index = currentPage - 2, times = 0;
        index < totalPage + 1 && times < 5; 
        index++, times++) {

        if (index < 1) {
            times = times - 1;
        } 
        else if (index == currentPage) {
            $('#pagination').append(`
            <button class="btn btn-success page ml-1 numberedButtons" 
                value="${index}"> ${index} 
            </button>
            `)
        } else {
            $('#pagination').append(`
            <button class="btn btn-primary page ml-1 numberedButtons" 
                value="${index}"> ${index} 
            </button>
            `)
        }
    }
    if (currentPage < totalPage){
        $('#pagination').append(`
        <button class="btn btn-primary page ml-1 next">
            Next
        </button>
        `)
    }
}

const displayFilterForm = async () => {
    const allTypes = await axios.get(`https://pokeapi.co/api/v2/type`);
    //console.log(allTypes.data.results);

    let i = 0;
    $('#typeFilter').html(`
        ${allTypes.data.results.map((type) => {
            i++;
            return `
            <input type="checkbox" class="pokeType" value="${i}" 
            name="${type.name}"> ${type.name}`
        }).join(' ')}
    </ul>
    `)
}

const filterPokemon = async(selectedTypes) => {
    if (selectedTypes.length === 0) {
        response = await axios.get(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=${totalPokemon}`);
        allPokemons = response.data.results;
    } else if (selectedTypes.length > 0) {
        if (selectedTypes.length === 1) {
            response = await axios.get(`https://pokeapi.co/api/v2/type/${selectedTypes}`);
            allPokemons = response.data.pokemon.map((eachPokemon) => eachPokemon.pokemon);
        } else if (selectedTypes.length === 2) {
            secondResponse = await axios.get(`https://pokeapi.co/api/v2/type/${selectedTypes[1]}`);
            secondList = secondResponse.data.pokemon.map((eachPokemon) => eachPokemon.pokemon);
            console.log("Second list! ", secondList);
            
            const commonPokemons = [];
            allPokemons.map((aPokemon) => {
                secondList.map((eachPokemon) => {
                    if (eachPokemon.name === aPokemon.name) {
                        commonPokemons.push(aPokemon);
                    }
                });
            })
            allPokemons = commonPokemons;
        }        
    }
    console.log("2. allPokemons Immediately after filtering: ", allPokemons);
}

$(document).ready(setup); 