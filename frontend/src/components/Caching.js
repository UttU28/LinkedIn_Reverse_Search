import Cookies from 'universal-cookie';

function Caching() {
    const cookies = new Cookies();
    cookies.set('myCat', 'Pacman', { path: '/' });
    console.log(cookies.get('myCat')); // Pacman
}

export default Caching;
