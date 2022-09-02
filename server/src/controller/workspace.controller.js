const MemberModel = require("../model/team.model");
const WorkspaceModel = require("../model/workspace.model");
const { APIError } = require("../utils/apiError");
const { buildWorkspace, buildResponse } = require("../utils/response");

exports.create=async(req,res,next)=>{
    try { 
        const {name, description}=req.body;
        if(!name || !description)
        return next(APIError.badRequest());
        req.body.creatorid= req.id;

        const workspace = await WorkspaceModel.create({...req.body});
        if(!workspace)
        return next(APIError.customError());

        const member = await MemberModel.create({
            workspace:workspace._id,
            members:req.id, 
            role:"admin"
        });
        if(!member){
            await WorkspaceModel.findByIdAndDelete(workspace._id);
            return next(APIError.customError("Workspace could be created successfully"));
        }
        const data = buildWorkspace(workspace.toObject());
        const response= buildResponse("Workspace created",data,"workspace",{success:"workspace created successfully"});
        res.status(201).json(response);
    } catch (error) {
        next(error)
    }
}

exports.getWorkspace=async(req,res,next)=>{
    try { 
        const userid = req.query.id;
        const workspace = await MemberModel.find({memberid:userid}).populate({path:"workspace",select:"name description status"});
        console.log(workspace);
        if(workspace.length===0)
        return next(APIError.customError("No workspace created",200)); 
        const data =workspace.map((curr)=>{ 
            return buildWorkspace(curr.toObject());
        }) ; 
        const response= buildResponse("Found",data,"userworkspaces");
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}
exports.getWorkspaceById=async(req,res,next)=>{
    try { 
        const userid = req.id;
        const id = req.query.id; 
        const workspace = await WorkspaceModel.find({_id:id,creatorid:userid});
        if(workspace.length===0)
        return next(APIError.customError("No workspace Found",404)); 
        const data =workspace.map((curr)=>{ 
            return buildWorkspace(curr.toObject());
        }); 
        const response= buildResponse("Found",data,"userworkspaces");
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}
exports.deleteWorkspace=async(req,res,next)=>{
    try {
        const workspaceid=req.query.workspaceid;
        if(!workspaceid)
        return next(APIError.badRequest()); 
        const workspace = await MemberModel.findOneAndDelete({workspace:workspaceid}).populate({path:"workspace", match:{creatorid:req.id}});
    if(!workspace)
    return next(APIError.customError("Workspace does not exist",200));
    res.status(200).json({success:"Workspace deleted successfully"});
    } catch (error) {
        next(error);
    }
}

exports.updateWorkspace=async(req,res,next)=>{
try {
    const data={};
    if(!req.body.workspaceid)
    return next(APIError.badRequest()); 
    for(key in req.body){
        data[key] = req.body[key];
    }   
    const workspace = await WorkspaceModel.findOneAndUpdate({_d:data.workspaceid,creatorid:req.id},{data}); 
    if(!workspace) 
    return next(APIError.customError("Workspace does not exist",200)); 
    const buildData= buildWorkspace(workspace.toObject()); 
    const response= buildResponse("Updated",buildData,"userworkspaces",{success:"Workspace updated successfully"});
    res.status(200).json(response);
} catch (error) {
    next(error);
}
}
