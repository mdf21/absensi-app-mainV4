const bcrypt = require('bcrypt');

   async function makeHash() {
       const passwordBaru = 'PasswordBaruAnda123'; // Ganti dengan password pilihan Anda
       const hashed = await bcrypt.hash(passwordBaru, 10);
       console.log("----------------------------------------");
       console.log("Password Asli :", passwordBaru);
       console.log("Hash Baru     :", hashed);
       console.log("----------------------------------------");
   }

   makeHash();
