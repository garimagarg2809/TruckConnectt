// Connect TruckConnect to Supabase
const SUPABASE_URL = "https://dpwxnimmomhwveyearvu.supabase.co";
const SUPABASE_KEY = "sb_publishable_fo7eLLC1bho_IFVND3x9LQ_nSSvCqfe";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("TruckConnect connected to Supabase!");
async function testDatabase() {
    const { data, error } = await supabaseClient
        .from("loads")
        .select("*");

    if (error) {
        console.log("Database error:", error.message);
    } else {
        console.log("Database connected successfully!", data);
    }
}

testDatabase();
// Get the form and loads section
let loadForm = document.getElementById("loadForm");
let loadsList = document.getElementById("loadsList");

// Get saved loads from browser storage
let loads = [];
let selectedLoadIndex = null;

// Function to display available loads
async function displayLoads() {

    loadsList.innerHTML = "";

    if (loads.length === 0) {
        loadsList.innerHTML = "<p>No loads available yet.</p>";
        return;
    }

    const { data: allOffers, error } = await supabaseClient
        .from("offers")
        .select("*");

    if (error) {
        console.log("Error fetching offers:", error.message);
    }

    loads.forEach(function(load, index) {

        let card = document.createElement("div");
        card.className = "load-card";

        let heading = document.createElement("h3");
        heading.textContent = load.material;

        let details = document.createElement("p");

        details.textContent =
            "Pickup: " + load.pickup +
            " | Drop: " + load.drop +
            " | Date: " + (load.date || "Not specified") +
            " | Time: " + (load.time || "Not specified") +
            " | Weight: " + load.weight + " tonnes" +
            " | Budget: ₹" + load.budget;

        let offerButton = document.createElement("button");

        offerButton.textContent = "Make an Offer";
        offerButton.className = "btn";

        offerButton.addEventListener("click", function() {

            selectedLoadIndex = index;

            document.getElementById("selectedLoad").textContent =
                "Selected Load: " + load.material +
                " (" + load.pickup + " to " + load.drop + ")";

            document.getElementById("truckForm").scrollIntoView({
                behavior: "smooth"
            });

        });

        card.appendChild(heading);
        card.appendChild(details);

        // Show offers belonging to this load
        let offersHeading = document.createElement("h4");
        offersHeading.textContent = "Transport Offers";
        card.appendChild(offersHeading);

        let loadOffers = (allOffers || []).filter(function(offer) {
            return String(offer.load_id) === String(load.id);
        });

        if (loadOffers.length === 0) {

            let noOffers = document.createElement("p");
            noOffers.textContent = "No offers received yet.";
            card.appendChild(noOffers);

        } else {

            loadOffers.forEach(function(offer) {

                let offerDetails = document.createElement("p");

                offerDetails.textContent =
                    "Truck: " + offer.truck_number +
                    " | Driver: " + offer.driver_name +
                    " | Capacity: " + offer.capacity + " tonnes" +
                    " | Price: ₹" + offer.offer_price;

                card.appendChild(offerDetails);

            });

        }

        card.appendChild(offerButton);
        loadsList.appendChild(card);

    });
}

// Handle seller form submission
loadForm.addEventListener("submit", async function(event) {

    event.preventDefault();
const { data: { user }, error: userError } =
    await supabaseClient.auth.getUser();

if (userError || !user) {
    alert("Please log in before posting a load.");
    return;
}
    const newLoad = {
        user_id: user.id,
        material: document.getElementById("material").value,
        pickup: document.getElementById("pickup").value,
        drop_location: document.getElementById("drop").value,
        pickup_date: document.getElementById("date").value || null,
        pickup_time: document.getElementById("time").value || null,
        weight: Number(document.getElementById("weight").value),
        budget: Number(document.getElementById("budget").value)
    };

    const { data, error } = await supabaseClient
        .from("loads")
        .insert([newLoad])
        .select();

    if (error) {
        alert("Could not post load: " + error.message);
        return;
    }

    alert("Load posted successfully!");

    loadForm.reset();

    const { data: updatedLoads, error: fetchError } =
        await supabaseClient
            .from("loads")
            .select("*")
            .order("id", { ascending: false });

    if (fetchError) {
        console.log(fetchError.message);
        return;
    }

    loads = updatedLoads;
    displayLoads();

});

// Get loads from Supabase when website opens
async function fetchLoads() {

    const { data, error } = await supabaseClient
        .from("loads")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.log("Error loading loads:", error.message);
        return;
    }

    loads = data.map(function(load) {
        return {
            ...load,
            drop: load.drop_location,
            date: load.pickup_date,
            time: load.pickup_time
        };
    });

    displayLoads();
}

fetchLoads();
// Get the truck owner form
let truckForm = document.getElementById("truckForm");

// Get the offers display area
let offersList = document.getElementById("offersList");

// Get previously saved transport offers
let offers = [];
  
// Display offers stored in Supabase
async function displayOffers() {

    offersList.innerHTML = "";

    const { data, error } = await supabaseClient
        .from("offers")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.log("Error loading offers:", error.message);
        return;
    }

    offers = data;

    if (offers.length === 0) {
        offersList.innerHTML = "<p>No offers submitted yet.</p>";
        return;
    }

    offers.forEach(function(offer) {

        let card = document.createElement("div");
        card.className = "load-card";

        let heading = document.createElement("h3");
        heading.textContent = "Truck: " + offer.truck_number;

        let details = document.createElement("p");

        details.textContent =
            "Driver: " + offer.driver_name +
            " | Capacity: " + offer.capacity + " tonnes" +
            " | Offered Price: ₹" + offer.offer_price;

        card.appendChild(heading);
        card.appendChild(details);

        offersList.appendChild(card);

    });
}

// Handle truck owner form submission
truckForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (selectedLoadIndex === null) {
        alert("Please select a load before submitting an offer!");
        return;
    }

    const selectedLoad = loads[selectedLoadIndex];

    const { data: { user }, error: userError } =
    await supabaseClient.auth.getUser();

if (userError || !user) {
    alert("Please log in before submitting an offer.");
    return;
}

const newOffer = {
    user_id: user.id,
    load_id: selectedLoad.id,
        truck_number: document.getElementById("truckNumber").value,
        capacity: Number(document.getElementById("capacity").value),
        offer_price: Number(document.getElementById("offerPrice").value),
        driver_name: document.getElementById("driverName").value
    };

    const { error } = await supabaseClient
        .from("offers")
        .insert([newOffer]);

    if (error) {
        alert("Could not submit offer: " + error.message);
        return;
    }

    alert("Transport offer submitted successfully!");

    truckForm.reset();
    selectedLoadIndex = null;

    document.getElementById("selectedLoad").textContent =
        "Select a load above before submitting your offer.";

    displayOffers();

});

// Display saved offers when website opens
displayOffers();
console.log("TruckConnect JavaScript is working!");
// TruckConnect Signup
const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const role = document.getElementById("userRole").value;

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                role: role
            }
        }
    });

    if (error) {
        document.getElementById("authMessage").textContent =
            error.message;
        return;
    }

    document.getElementById("authMessage").textContent =
        data.session
        ? "Account created successfully! You are logged in."
        : "Account created! Please check your email to verify your account.";

    signupForm.reset();

});


// TruckConnect Login
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        document.getElementById("authMessage").textContent =
            error.message;
        return;
    }

    const role = data.user.user_metadata.role;

    document.getElementById("authMessage").textContent =
        "Welcome! You are logged in as " + role + ".";
        logoutButton.style.display = "inline-block";
        applyRoleAccess(role);

    loginForm.reset();

});
// TruckConnect Logout
const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", async function() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Logout failed: " + error.message);
        return;
    }

    document.getElementById("authMessage").textContent =
        "You have logged out successfully.";

    logoutButton.style.display = "none";
});
// Role-based access
function applyRoleAccess(role) {
    const postLoad = document.getElementById("post-load");
    const truckArea = document.getElementById("truck-owner-area");

    if (role === "seller") {
        postLoad.style.display = "block";
        truckArea.style.display = "none";
    } 
    else if (role === "truck_owner") {
        postLoad.style.display = "none";
        truckArea.style.display = "block";
    }
}
// Restore login session after page refresh
(async function checkLoginStatus() {
    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (session) {
        const role = session.user.user_metadata.role;

        logoutButton.style.display = "inline-block";
        applyRoleAccess(role);
    } else {
        document.getElementById("post-load").style.display = "none";
        document.getElementById("truck-owner-area").style.display = "none";
    }
})();
