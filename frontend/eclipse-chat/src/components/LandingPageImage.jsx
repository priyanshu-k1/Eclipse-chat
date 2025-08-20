import landingpage from "../assets/landingpage.png";

export const LandingPageImage = () => {
  return (
    <div className="imageHolder">
        <div className="loginSection">
            <button className="loginButton">Login</button>
        </div>
        <div className="imageContainer">
            <img src={landingpage} alt="Communication vector" className="landingImage" />
        </div>
        <div className="footer-note">
            Developed with <span className="heart">❤️</span> by 
            <a href="https://github.com/priyanshu-k1" target="_blank" rel="noopener noreferrer">Priyanshu Kumar</a>  
        </div>
    </div>
  );
};

export default LandingPageImage;