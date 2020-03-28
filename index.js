var imC=null,cnv,ctx,POINTS=[]
var COLOR_MATCH=[["#ad7866",20],["#ce9e8e",15],["#c49580",10],["#89654f",15],["#764443",10],["#d9aa6d",10]]
var cam_constraints={audio:false,video:{width:{ideal:1280,max:1280},height:{ideal:720,max:720},frameRate:{ideal:60,max:60},deviceId:null}}
var CAM_ID=1
var l_tm=-1;



function init(){
	cnv=document.getElementsByClassName("c1")[0]
	ctx=cnv.getContext("2d")
	navigator.mediaDevices.enumerateDevices().then(function(r){
		var cl=[]
		r.forEach((a)=>{
			if (a.label.toLowerCase().includes("camera")){cl.push(a)}
		})
		cam_constraints.video.deviceId=cl[CAM_ID].deviceId
		navigator.mediaDevices.getUserMedia(cam_constraints).then(function(stream){
			var video=document.getElementsByClassName("v1")[0]
			video.srcObject=stream
			video.onloadedmetadata=function(e){
				video.play()
			}
			var t=stream.getVideoTracks()[0]
			imC=new ImageCapture(t)
			cap()
		}).catch(function(err){
			console.log(err.name+": "+err.message)
		})
	})
}



function cap(){
	if (l_tm!=-1&&performance.now()-l_tm<500){
		return
	}
	l_tm=performance.now()
	var im=imC.grabFrame().then(function(img){
		filter_img(img,COLOR_MATCH)
		cap()
	}).catch(function(err){
		console.log("Frame Error: "+err)
	})
	setTimeout(cap,1000)
}



function filter_img(img,c,MAX_GROUP_DIST=50,MIN_GROUP_ITEMS=1000){
	c=c.slice()
	c.forEach((a,b,c)=>c[b]=[parseInt(a[0].substring(1,3),16),parseInt(a[0].substring(3,5),16),parseInt(a[0].substring(5,7),16),a[1],a[2]||a[1],a[3]||a[1]])
	var ctx=document.getElementsByClassName("c1")[0].getContext("2d")
	ctx.canvas.width=img.width
	ctx.canvas.height=img.height
	ctx.drawImage(img,0,0)
	var img=ctx.getImageData(0,0,img.width,img.height)
	var groups=[]
	var x=0,y=0
	for (var i=0;i<img.data.length;i+=4){
		var s=false
		for (var cl of c){
			if (Math.abs(img.data[i]-cl[0])<=cl[3]&&Math.abs(img.data[i+1]-cl[1])<=cl[4]&&Math.abs(img.data[i+2]-cl[2])<=cl[5]){
				s=true
				break
			}
		}
		if (s==true){
			if (groups.length==0){
				groups.push([[i,x,y]])
			}
			else{
				var s=false
				for (var g of groups){
					for (var e of g){
						if (Math.abs(e[1]-x)+Math.abs(e[2]-y)<=MAX_GROUP_DIST){
							s=true
							break
						}
					}
					if (s==true){
						g.push([i,x,y])
						break
					}
				}
				if (s==false){
					groups.push([[i,x,y]])
				}
			}
		}
		x++
		if (x==ctx.canvas.width){
			x=0
			y++
		}
	}
	var group=null,bl=-1
	for (var g of groups){
		if (g.length>bl){
			bl=g.length
			group=g
		}
	}
	for (var i=0;i<img.data.length;i+=4){
		img.data[i+3]=50
	}
	if (group.length<MIN_GROUP_ITEMS){
		ctx.putImageData(img,0,0)
		return
	}
	for (var e of group){
		img.data[e[0]+3]=255
	}
	ctx.putImageData(img,0,0)
}



document.addEventListener("DOMContentLoaded",init,false)