#include "Component.h"
#include "frame.h"
Component::Component() : Component("",0,0,0,0) {}

Component::Component(string name, int x, int y, int width, int height)
{
	name_ = name;
	height_ = height;
	width_ = width;
	posx = x;
	posy = y;
	pos.x_ = x;
	pos.y_ = y;
}

void Component::setBound(int x, int y, int w, int h)
{
	posx = x;
	posy = y;
	width_ = w;
	height_ = h;
}

void Component::setContainer(Container* c)
{
	container_ = c;
}

int Component::getPosX()
{
	return posx;
}
int Component::getPosY()
{
	return posy;
}
void Component::setPosX(int x)
{
	posx = x;
	pos.x_ = x;
}
void Component::setPosY(int y)
{
	posy = y;
	pos.y_ = y;
}

void Component::setSize(int w, int h)
{
	width_ = w;
	height_ = h;
}

string Component::getName()
{
	return name_;
}
void Component::repaint(HDC dc) 
{

}
bool Component::eventHandler(ActionEvent e) { return 0; }
bool Component::includes(MPoint p)
{
	if (p.x_ < width_ && p.y_ < height_)
	{
		return true;
	}
	return false;
}