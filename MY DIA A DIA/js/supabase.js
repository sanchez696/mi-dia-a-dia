const supabase = window.supabase.createClient(
APP.supabaseUrl,
APP.supabaseKey
);

// Guardar datos en una tabla
async function guardar(tabla, datos){

const { data, error } =
await supabase
.from(tabla)
.insert([datos]);

if(error){
console.error(error);
return false;
}

return true;
}

// Obtener todos los registros
async function obtener(tabla){

const { data, error } =
await supabase
.from(tabla)
.select("*");

if(error){
console.error(error);
return [];
}

return data;
}

// Eliminar un registro por id
async function eliminar(tabla, id){

const { error } =
await supabase
.from(tabla)
.delete()
.eq("id", id);

if(error){
console.error(error);
return false;
}

return true;
}

// Actualizar un registro
async function actualizar(
tabla,
id,
datos
){

const { error } =
await supabase
.from(tabla)
.update(datos)
.eq("id", id);

if(error){
console.error(error);
return false;
}

return true;
}