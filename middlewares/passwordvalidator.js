function passwordvalidator(ch){
    if (ch.length<6) {

        return false
    } 
    let Upper=0
    let lower=0
    let s=0
    let n=0
     for (let i = 0; i < ch.length; i++){
        if (ch[i] >= "A" && ch[i] <= "Z") {
            Upper++;
        }
        if (ch[i] >= "a" && ch[i] <= "z") {
            lower++;
        }
        if (ch[i] >= "0" && ch[i] <= "9") {
            n++;
        } 
        const symbols = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        if (symbols.includes(ch[i])) {
            s++;
        }}
        
        if(n==0 || lower==0 || Upper==0 || s==0){
            return false
        }
      else {return true}
    
}

module.exports=passwordvalidator