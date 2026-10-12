$("gBtn").onclick = async () => {
  console.log("Kliknuto je dugme za prijavu!");
  try {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    console.log("Uspešna prijava:", res.user.email);
  } catch (e) {
    console.error("Greška pri prijavi (kod):", e.code);
    console.error("Greška pri prijavi (poruka):", e.message);
    say("Greška: " + e.code + " - " + e.message, true);
  }
};
