#include "figure.h"
#include "Misc.h"

Figure::Figure()
{
	//
}
Figure::Figure(MPoint start, MPoint end) : start_(start), end_(end)
{
}
void Figure::draw(HDC dc) {}

bool Figure::find(MPoint p)
{
	return p.x_ >= start_.x_ && p.x_ <= end_.x_ 
		&& p.y_ >= start_.y_ && p.y_ <= end_.y_;
}

void Figure::move(int x, int y)
{
	start_.x_ = start_.x_ + x;
	end_.x_ = end_.x_ + x;
	start_.y_ = start_.y_ + y;
	end_.y_ = end_.y_ + y;
}

MPoint Figure::getStart()
{
	return start_;
}

MPoint Figure::getEnd()
{
	return end_;
}

MRectangle::MRectangle()
{
	//
}
MRectangle::MRectangle(MPoint start, MPoint end) : Figure(start, end)
{
	//
}

void MRectangle::draw(HDC dc)
{
	Rectangle(dc, start_.x_, start_.y_, end_.x_, end_.y_);
}

MEllipse::MEllipse()
{
	//
}
MEllipse::MEllipse(MPoint start, MPoint end) : Figure(start, end)
{
	//
}

void MEllipse::draw(HDC dc)
{
	Ellipse(dc, start_.x_, start_.y_, end_.x_, end_.y_);
}

MLine::MLine()
{
	//
}
MLine::MLine(MPoint start, MPoint end) : Figure(start, end)
{
	//
}

void MLine::draw(HDC dc)
{
	MoveToEx(dc, start_.x_, start_.y_, NULL);
	LineTo(dc,end_.x_, end_.y_);
}
