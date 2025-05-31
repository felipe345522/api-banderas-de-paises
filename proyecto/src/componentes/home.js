export default async function mostrarHome() {
    const app = document.getElementById("app");
    
    // Mostrar loader mientras carga
    app.innerHTML = `
        <h2>Países y sus Banderas</h2>
        <div id="loader" style="text-align: center;">Cargando...</div>
        <div id="lista" style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 20px;"></div>
    `;

    const lista = document.getElementById("lista");
    const loader = document.getElementById("loader");

    try {
        const res = await fetch("https://restcountries.com/v3.1/all");
        
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        
        const data = await res.json();

        // Ordenar países alfabéticamente
        data.sort((a, b) => a.name.common.localeCompare(b.name.common));

        lista.innerHTML = ""; // Limpiar loader
        
        data.forEach((pais) => {
            const item = document.createElement("div");
            item.style.cssText = `
                text-align: center;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                transition: transform 0.2s;
            `;
            
            item.innerHTML = `
                <h3>${pais.name.common}</h3>
                <img 
                    src="${pais.flags.svg}" 
                    alt="Bandera de ${pais.name.common}"
                    style="width: 120px; height: auto; object-fit: cover; border: 1px solid #eee;"
                    loading="lazy"
                />
                ${pais.capital ? `<p>Capital: ${pais.capital[0]}</p>` : ""}
            `;
            
            // Efecto hover
            item.addEventListener("mouseenter", () => item.style.transform = "scale(1.05)");
            item.addEventListener("mouseleave", () => item.style.transform = "scale(1)");
            
            lista.appendChild(item);
        });

    } catch (error) {
        loader.remove();
        lista.innerHTML = `
            <div style="color: red; padding: 20px; text-align: center;">
                <p>Error al cargar los países</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}