// Caching.js
import Cookies from 'universal-cookie';

function AddToCaching(what, whatData) {
    const cookies = new Cookies();
    cookies.set(what, whatData, { path: '/' });
}

function GetFromCaching(what) {
    const cookies = new Cookies();
    return cookies.get(what);
}

export { AddToCaching, GetFromCaching };
